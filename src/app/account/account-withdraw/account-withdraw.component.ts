import { Component, Input, OnInit, ViewChild, NgZone } from '@angular/core';
import { FormControl, FormGroup, NgForm } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { AccountService } from '../../common/web3/account.service';
import { FSP_NAME, NutsPlatformService } from '../../common/web3/nuts-platform.service';
import { TransactionInitiatedDialog } from 'src/app/common/transaction-initiated-dialog/transaction-initiated-dialog.component';
import { AccountBalanceService } from 'src/app/common/web3/account-balance.service';

@Component({
  selector: 'app-account-withdraw',
  templateUrl: './account-withdraw.component.html',
  styleUrls: ['./account-withdraw.component.scss']
})
export class AccountWithdrawComponent implements OnInit {
  @Input() public instrument: string;

  public selectedToken = 'ETH';
  public instrumentEscrowBalance: number;
  public amountControl: FormControl;
  public withdrawForm: FormGroup;

  @ViewChild('form', { static: true }) private form: NgForm;

  constructor(private dialog: MatDialog, private zone: NgZone,
    private nutsPlatformService: NutsPlatformService, private userBalanceService: AccountBalanceService,
    private instrumentEscrowService: AccountService) { }

  ngOnInit() {
    this.amountControl = new FormControl('', this.validBalance.bind(this));
    this.withdrawForm = new FormGroup({ amount: this.amountControl });
  }

  onTokenSelected(token: string) {
    this.amountControl.reset();
    this.selectedToken = token;
  }

  setMaxAmount() {
    this.withdrawForm.patchValue({ amount: this.instrumentEscrowBalance });
  }

  withdraw() {
    console.log(this.withdrawForm);
    if (!this.withdrawForm.valid) {
      return;
    }
    let withdrawPromise;
    if (this.selectedToken === 'ETH') {
      withdrawPromise = this.instrumentEscrowService.withdrawETH(this.instrument, this.amountControl.value);

    } else {
      withdrawPromise = this.instrumentEscrowService.withdrawToken(this.instrument, this.selectedToken, this.amountControl.value);
    }

    withdrawPromise.on('transactionHash', transactionHash => {
      this.zone.run(() => {
        // Opens Withdraw Initiated dialog.
        const transactionInitiatedDialog = this.dialog.open(TransactionInitiatedDialog, {
          width: '90%',
          data: {
            type: 'withdraw',
            fspName: FSP_NAME,
            tokenName: this.selectedToken,
            amount: this.amountControl.value,
          },
        });

        transactionInitiatedDialog.afterClosed().subscribe(() => {
          this.form.resetForm();
          // Scroll to top
          document.body.scrollTop = document.documentElement.scrollTop = 0;
        });
      });

      // Monitoring transaction status(work around for Metamask mobile)
      const interval = setInterval(async () => {
        const receipt = await this.nutsPlatformService.web3.eth.getTransactionReceipt(transactionHash);
        if (!receipt) return;
        console.log(receipt);

        // Update instrument balance
        this.userBalanceService.updateInstrumentBalance(this.instrument, this.selectedToken);
        this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
        clearInterval(interval);
      }, 2000);
    });

  }

  validBalance(control: FormControl): { [s: string]: boolean } {
    if (!control.value) {
      return { 'required': true };
    }
    if (this.instrumentEscrowBalance < Number(control.value)) {
      return { 'insufficientBalance': true };
    }
    if ((this.selectedToken === 'ETH' && Number.isNaN(Number(control.value))) || Number(control.value) <= 0) {
      return { 'nonPositiveAmount': true };
    }
    if (this.selectedToken !== 'ETH' && !/^[1-9][0-9]*$/.test(control.value)) {
      return { 'nonIntegerAmount': true };
    }
  }
}
import { Component, Input, OnInit, ViewChild, NgZone } from '@angular/core';
import { FormControl, FormGroup, NgForm } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { AccountService } from '../account.service';
import { FSP_NAME, NutsPlatformService } from '../../common/web3/nuts-platform.service';
import { TransactionInitiatedDialog } from 'src/app/common/transaction-initiated-dialog/transaction-initiated-dialog.component';
import { TokenService } from 'src/app/common/token/token.service';
import { TokenModel } from 'src/app/common/token/token.model';

@Component({
  selector: 'app-account-withdraw',
  templateUrl: './account-withdraw.component.html',
  styleUrls: ['./account-withdraw.component.scss']
})
export class AccountWithdrawComponent implements OnInit {
  @Input() public instrument: string;
  public selectedToken: TokenModel;
  public includedTokens: TokenModel[] = [];
  public accountBalance: string;
  public amountControl: FormControl;
  public withdrawForm: FormGroup;

  @ViewChild('form', { static: true }) private form: NgForm;

  constructor(private dialog: MatDialog, private zone: NgZone, private nutsPlatformService: NutsPlatformService,
    private accountService: AccountService, private tokenService: TokenService) {

    this.amountControl = new FormControl('', this.validBalance.bind(this));
    this.withdrawForm = new FormGroup({ amount: this.amountControl });
  }

  ngOnInit() {
    this.includedTokens = this.tokenService.tokens.filter(token => token.supportsTransaction);
    this.selectedToken = this.includedTokens[0];
  }

  onTokenSelected(token: TokenModel) {
    this.amountControl.reset();
    this.selectedToken = token;
  }

  setMaxAmount() {
    this.withdrawForm.patchValue({
      amount: this.tokenService.getDisplayValue(this.selectedToken.tokenAddress, this.accountBalance)
    });
  }

  withdraw() {
    if (!this.withdrawForm.valid) {
      return;
    }
    const withdrawValue = this.tokenService.getActualValue(this.selectedToken.tokenAddress, this.amountControl.value);
    let withdrawPromise;
    if (this.selectedToken.tokenName === this.nutsPlatformService.getWETH()) {
      withdrawPromise = this.accountService.withdrawETH(this.instrument, withdrawValue);
    } else {
      withdrawPromise = this.accountService.withdrawToken(this.instrument, this.selectedToken.tokenAddress, withdrawValue);
    }

    withdrawPromise.on('transactionHash', transactionHash => {
      this.zone.run(() => {
        // Opens Withdraw Initiated dialog.
        const transactionInitiatedDialog = this.dialog.open(TransactionInitiatedDialog, {
          width: '90%',
          data: { type: 'withdraw', fspName: FSP_NAME, token: this.selectedToken, tokenAmount: withdrawValue },
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
        if (!receipt || !receipt.blockNumber) return;
        console.log(receipt);

        // Update instrument balance
        this.accountService.refreshAccountBalance(this.instrument, 5, 3000);
        this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
        clearInterval(interval);
      }, 4000);
    });

  }

  validBalance(control: FormControl): { [s: string]: boolean } {
    if (!control.value) {
      return { 'required': true };
    }
    const value = Number(control.value);
    if (Number.isNaN(value) || value <= 0) {
      return { 'nonPositiveAmount': true };
    }

    const BN = this.nutsPlatformService.web3.utils.BN;
    if (new BN(this.accountBalance).lt(new BN(this.tokenService.getActualValue(this.selectedToken.tokenAddress, control.value)))) {
      return { 'insufficientBalance': true };
    }
  }
}
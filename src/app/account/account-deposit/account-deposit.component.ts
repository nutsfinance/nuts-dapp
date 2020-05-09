import { Component, Input, Output, EventEmitter, OnInit, OnChanges, ViewChild, NgZone, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, NgForm } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { AccountService } from '../../common/web3/account.service';
import { FSP_NAME, NutsPlatformService } from '../../common/web3/nuts-platform.service';
import { TransactionInitiatedDialog } from 'src/app/common/transaction-initiated-dialog/transaction-initiated-dialog.component';
import { AccountBalanceService } from 'src/app/common/web3/account-balance.service';

@Component({
  selector: 'app-account-deposit',
  templateUrl: './account-deposit.component.html',
  styleUrls: ['./account-deposit.component.scss']
})
export class AccountDepositComponent implements OnInit, OnChanges {
  @Input() public instrument: string;
  @Input() public selectedToken = 'ETH';
  @Input() public amount: string;
  @Output() public approveToken = new EventEmitter<string>();

  public walletBalance: number;
  public amountControl: FormControl;
  public depositFormGroup: FormGroup;
  public showApprove = false;

  @ViewChild('form', { static: true }) private form: NgForm;

  constructor(private dialog: MatDialog, private zone: NgZone,
    private nutsPlatformService: NutsPlatformService, private accountBalanceService: AccountBalanceService,
    private instrumentEscrowService: AccountService) {
    this.amountControl = new FormControl(this.amount, this.validBalance.bind(this));
    this.depositFormGroup = new FormGroup({ amount: this.amountControl });
  }

  ngOnInit() { }

  ngOnChanges(changes: SimpleChanges) {
    this.depositFormGroup.patchValue({ amount: this.amount });
  }

  onTokenSelected(token: string) {
    this.form.reset();
    this.selectedToken = token;
    if (token == 'ETH') {
      this.showApprove = false;
      this.approveToken.next('');
      this.amountControl.enable();
    } else {
      this.nutsPlatformService.getWalletAllowance(this.instrument, token).then(allowance => {
        console.log('Allowance for ', token, allowance, typeof allowance);
        if (allowance) {
          this.showApprove = false;
          this.approveToken.next('');
          this.amountControl.enable();
        } else {
          this.showApprove = true;
          this.approveToken.next(this.selectedToken);
          this.amountControl.disable();
        }
      });
    }
  }

  setMaxAmount() {
    if (this.amountControl.enabled) {
      this.depositFormGroup.patchValue({
        amount: this.nutsPlatformService.getDisplayValueByName(this.selectedToken, this.walletBalance),
      });
    }
  }

  submit() {
    if (this.depositFormGroup.invalid) {
      return;
    }
    if (this.showApprove) {
      this.approve();
    } else {
      this.deposit();
    }
  }

  validBalance(control: FormControl): { [s: string]: boolean } {
    if (!control.value) {
      return { 'required': true };
    }
    if (this.walletBalance < Number(control.value)) {
      return { 'insufficientBalance': true };
    }
    if ((this.selectedToken === 'ETH' && Number.isNaN(Number(control.value))) || Number(control.value) <= 0) {
      return { 'nonPositiveAmount': true };
    }
    if (this.selectedToken !== 'ETH' && !/^[1-9][0-9]*$/.test(control.value)) {
      return { 'nonIntegerAmount': true };
    }
    return null;
  }

  private approve() {
    this.instrumentEscrowService.approve(this.instrument, this.selectedToken)
      .on('transactionHash', transactionHash => {
        this.zone.run(() => {
          // Opens Approval Initiated dialog.
          const transactionInitiatedDialog = this.dialog.open(TransactionInitiatedDialog, {
            width: '90%',
            data: {
              type: 'approve',
              fspName: FSP_NAME,
              tokenName: this.selectedToken,
            },
          });

          transactionInitiatedDialog.afterClosed().subscribe(() => {
            // Scroll to top
            document.body.scrollTop = document.documentElement.scrollTop = 0;
          });
        });

        // Monitoring transaction status(work around for Metamask mobile)
        const interval = setInterval(async () => {
          const receipt = await this.nutsPlatformService.web3.eth.getTransactionReceipt(transactionHash);
          if (!receipt || !receipt.blockNumber) return;

          // Once the Approve transaction is successful, enables the button
          setTimeout(() => {
            this.nutsPlatformService.getWalletAllowance(this.instrument, this.selectedToken).then(allowance => {
              console.log('Allowance for', this.selectedToken, allowance);
              this.showApprove = false;
              this.approveToken.next('');
              this.amountControl.enable();
              this.amountControl.markAsPristine();
            });
          }, 2000);
          this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
          clearInterval(interval);
        }, 4000);
      });
  }

  private deposit() {
    const depositValue = this.nutsPlatformService.getTokenActualValueByName(this.selectedToken, this.amountControl.value);
    let depositPromise;
    if (this.selectedToken === 'ETH') {
      depositPromise = this.instrumentEscrowService.depositETH(this.instrument, depositValue);
    } else {
      depositPromise = this.instrumentEscrowService.depositToken(this.instrument, this.selectedToken, depositValue);
    }
    depositPromise.on('transactionHash', transactionHash => {
      this.zone.run(() => {
        // Opens Deposit Initiated dialog.
        const transactionInitiatedDialog = this.dialog.open(TransactionInitiatedDialog, {
          width: '90%',
          data: {
            type: 'deposit',
            fspName: FSP_NAME,
            tokenName: this.selectedToken,
            tokenAmount: depositValue,
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
        if (!receipt || !receipt.blockNumber) return;
        console.log('Deposit ETH receipt', receipt);

        // Update instrument balance
        this.accountBalanceService.getUserBalanceFromBackend(5, 3000);
        this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
        clearInterval(interval);
      }, 4000);
    })
      .on('error', console.error);
  }
}
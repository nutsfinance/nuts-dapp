import { Component, Input, OnInit, OnChanges, ViewChild, NgZone, SimpleChanges } from '@angular/core';
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
  @Input() public showApprove = false;

  public instrumentName = '';
  public accountBalance: number;
  public amountControl: FormControl;
  public depositFormGroup: FormGroup;

  public tokenSelectEnabled = true;     // Whether token select is enabled
  public submitEnabled = true;          // Whether the submit button is enabled

  @ViewChild('form', { static: true }) private form: NgForm;

  constructor(private dialog: MatDialog, private zone: NgZone,
    private nutsPlatformService: NutsPlatformService, private userBalanceService: AccountBalanceService,
    private instrumentEscrowService: AccountService) {
    this.amountControl = new FormControl(this.amount, this.validBalance.bind(this));
    this.depositFormGroup = new FormGroup({ amount: this.amountControl });
  }

  ngOnInit() { }

  ngOnChanges(changes: SimpleChanges) {
    this.instrumentName = this.instrument.charAt(0).toUpperCase() + this.instrument.substring(1);
    this.depositFormGroup.patchValue({ amount: this.amount });
    this.submitEnabled = true;

    if (this.selectedToken !== 'ETH' && !this.showApprove) {
      // If the selected token is not ETH and we show the Deposit button
      // This means we are in the deposit phase of the Approve-Deposit workflow
      this.amountControl.disable();
      this.tokenSelectEnabled = false;
    } else {
      this.amountControl.enable();
      this.tokenSelectEnabled = true;
    }
  }

  onTokenSelected(token: string) {
    this.form.reset();
    this.selectedToken = token;
    this.showApprove = this.selectedToken !== 'ETH';
  }

  setMaxAmount() {
    if (this.amountControl.enabled) {
      this.depositFormGroup.patchValue({ amount: this.accountBalance });
    }
  }

  submit() {
    if (this.depositFormGroup.invalid || !this.submitEnabled) {
      return;
    }
    if (this.showApprove) {
      this.approve();
    } else {
      if (this.selectedToken === 'ETH') {
        this.depositETH();
      } else {
        this.depositToken();
      }
    }
  }

  validBalance(control: FormControl): { [s: string]: boolean } {
    if (!control.value) {
      return { 'required': true };
    }
    if (this.accountBalance < Number(control.value)) {
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
    this.instrumentEscrowService.approve(this.instrument, this.selectedToken, this.amountControl.value)
      .on('transactionHash', transactionHash => {
        this.zone.run(() => {
          // Opens Approval Initiated dialog.
          const transactionInitiatedDialog = this.dialog.open(TransactionInitiatedDialog, {
            width: '90%',
            data: {
              type: 'approve',
              fspName: FSP_NAME,
              tokenName: this.selectedToken,
              amount: this.amountControl.value,
            },
          });

          transactionInitiatedDialog.afterClosed().subscribe(() => {
            // Scroll to top
            document.body.scrollTop = document.documentElement.scrollTop = 0;
          });
        });

        // After the Approve transaction is submitted
        // 1. Disables amount input
        this.amountControl.disable();
        // 2. Disables token select
        this.tokenSelectEnabled = false;
        // 3. Change button from Approve to Deposit
        this.showApprove = false;
        // 4. Disables the button
        this.submitEnabled = false;

        // Monitoring transaction status(work around for Metamask mobile)
        const interval = setInterval(async () => {
          const receipt = await this.nutsPlatformService.web3.eth.getTransactionReceipt(transactionHash);
          if (!receipt || !receipt.blockNumber) return;

          console.log('Approve receipt', receipt);
          // Once the Approve transaction is successful, enables the button
          this.submitEnabled = true;
          this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
          clearInterval(interval);
        }, 4000);
      });
  }

  private depositETH() {
    this.instrumentEscrowService.depositETH(this.instrument, this.amountControl.value)
      .on('transactionHash', transactionHash => {

        this.zone.run(() => {
          // Opens Deposit Initiated dialog.
          const transactionInitiatedDialog = this.dialog.open(TransactionInitiatedDialog, {
            width: '90%',
            data: {
              type: 'deposit',
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
          if (!receipt || !receipt.blockNumber) return;
          console.log('Deposit ETH receipt', receipt);

          // Update instrument balance
          setTimeout(() => {
            this.userBalanceService.updateAssetBalance(this.instrument, 'ETH');
          }, 2000)
          this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
          clearInterval(interval);
        }, 4000);
      })
      .on('error', console.error);
  }

  private depositToken() {
    this.instrumentEscrowService.depositToken(this.instrument, this.selectedToken, this.amountControl.value)
      .on('transactionHash', transactionHash => {

        this.zone.run(() => {
          // Opens Deposit Initiated dialog.
          const transactionInitiatedDialog = this.dialog.open(TransactionInitiatedDialog, {
            width: '90%',
            data: {
              type: 'deposit',
              fspName: FSP_NAME,
              tokenName: this.selectedToken,
              amount: this.amountControl.value,
            },
          });
          transactionInitiatedDialog.afterClosed().subscribe(() => {
            // Scroll to top
            document.body.scrollTop = document.documentElement.scrollTop = 0;
          });
        });

        // After Deposit transaction is submitted, disables submit button
        this.submitEnabled = false;

        // Monitoring transaction status(work around for Metamask mobile)
        const interval = setInterval(async () => {
          const receipt = await this.nutsPlatformService.web3.eth.getTransactionReceipt(transactionHash);
          if (!receipt || !receipt.blockNumber) return;
          console.log('Deposit token receipt', receipt);

          // After Deposit transaction is successful
          // 1. Reset form
          this.form.resetForm();
          // 2. Re-enable amount input
          this.amountControl.enable();
          // 3. Re-enable token select
          this.tokenSelectEnabled = true;
          // 4. Change button from Deposit to Approve
          this.showApprove = true;
          // 5. Re-enables submit button
          this.submitEnabled = true;

          // Update instrument balance
          setTimeout(() => {
            this.userBalanceService.updateAssetBalance(this.instrument, this.selectedToken);
          }, 2000);
          this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
          clearInterval(interval);
        }, 4000);
      });
  }
}
import { Component, Input, OnInit, ViewChild, NgZone } from '@angular/core';
import { FormControl, FormGroup, NgForm } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { InstrumentEscrowService } from '../../common/web3/instrument-escrow.service';
import { FSP_NAME, NutsPlatformService } from '../../common/web3/nuts-platform.service';
import { TransactionInitiatedDialog } from 'src/app/common/transaction-initiated-dialog/transaction-initiated-dialog.component';
import { UserBalanceService } from 'src/app/common/web3/user-balance.service';

@Component({
  selector: 'app-account-deposit',
  templateUrl: './account-deposit.component.html',
  styleUrls: ['./account-deposit.component.scss']
})
export class AccountDepositComponent implements OnInit {
  @Input() public instrument: string;
  @Input() public selectedToken = 'ETH';
  @Input() public amount: string;
  @Input() public showApprove = false;

  public accountBalance: number;
  public amountControl: FormControl;
  public depositFormGroup: FormGroup;

  @ViewChild('form', { static: true }) private form: NgForm;
  
  constructor(private dialog: MatDialog, private zone: NgZone,
    private nutsPlatformService: NutsPlatformService, private userBalanceService: UserBalanceService,
    private instrumentEscrowService: InstrumentEscrowService) { }

  ngOnInit() {
    this.amountControl = new FormControl(this.amount, this.validBalance.bind(this));
    this.depositFormGroup = new FormGroup({ amount: this.amountControl });
  }

  onTokenSelected(token: string) {
    this.form.reset();
    this.selectedToken = token;
    this.showApprove = this.selectedToken !== 'ETH';
  }

  setMaxAmount() {
    this.depositFormGroup.patchValue({ amount: this.accountBalance });
  }

  submit() {
    if (!this.depositFormGroup.valid) {
      return;
    }
    if (this.showApprove) {
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
            this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
            clearInterval(interval);
          }, 2000);
        });
    } else {
      if (this.selectedToken === 'ETH') {
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
              if (!receipt) return;
              console.log(receipt);

              // Update instrument balance
              this.userBalanceService.updateInstrumentBalance(this.instrument, 'ETH');
              this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
              clearInterval(interval);
            }, 2000);
          })
          .on('error', console.error);
      } else {
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
    }
  }

  testForm() {
    console.log(this.depositFormGroup);
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
}
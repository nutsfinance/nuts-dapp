import { Component, Input, OnInit, ViewChild, NgZone } from '@angular/core';
import { FormControl, FormGroup, NgForm } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { InstrumentEscrowService } from '../../common/web3/instrument-escrow.service';
import { FSP_NAME, NutsPlatformService } from '../../common/web3/nuts-platform.service';
import { TransactionInitiatedDialog } from 'src/app/common/transaction-initiated-dialog/transaction-initiated-dialog.component';

@Component({
  selector: 'app-wallet-deposit',
  templateUrl: './wallet-deposit.component.html',
  styleUrls: ['./wallet-deposit.component.scss']
})
export class WalletDepositComponent implements OnInit {
  @Input() private instrument: string;
  @Input() private selectedToken = 'ETH';
  @Input() private amount: string;
  @Input() private showApprove = false;

  @ViewChild('form', { static: true }) private form: NgForm;
  private accountBalance: number;
  private amountControl: FormControl;
  private depositFormGroup: FormGroup;

  constructor(private dialog: MatDialog, private zone: NgZone,
    private nutsPlatformService: NutsPlatformService,
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
    console.log(this.amountControl);
    console.log(this.depositFormGroup);

    if (!this.depositFormGroup.valid) {
      return;
    }
    if (this.showApprove) {
      this.instrumentEscrowService.approve(this.instrument, this.selectedToken, this.amountControl.value)
        .on('transactionHash', transactionHash => {
          this.zone.run(() => {
            // Opens Approval Initiated dialog.
            this.dialog.open(TransactionInitiatedDialog, {
              width: '90%',
              data: {
                type: 'approve',
                fspName: FSP_NAME,
                tokenName: this.selectedToken,
                amount: this.amountControl.value,
              },
            });
          });
        });
    } else {
      if (this.selectedToken === 'ETH') {
        this.instrumentEscrowService.depositETH(this.instrument, this.amountControl.value)
          .on('transactionHash', transactionHash => {

            this.zone.run(() => {
              // Opens Deposit Initiated dialog.
              this.dialog.open(TransactionInitiatedDialog, {
                width: '90%',
                data: {
                  type: 'deposit',
                  fspName: FSP_NAME,
                  tokenName: this.selectedToken,
                  amount: this.amountControl.value,
                },
              });
              this.form.resetForm();
              this.nutsPlatformService.balanceUpdatedSubject.next(this.selectedToken);
            });

          })
          .on('error', console.error);
      } else {
        this.instrumentEscrowService.depositToken(this.instrument, this.selectedToken, this.amountControl.value)
          .on('transactionHash', transactionHash => {

            this.zone.run(() => {
              // Opens Deposit Initiated dialog.
              this.dialog.open(TransactionInitiatedDialog, {
                width: '90%',
                data: {
                  type: 'deposit',
                  fspName: FSP_NAME,
                  tokenName: this.selectedToken,
                  amount: this.amountControl.value,
                },
              });
              this.form.resetForm();
              this.nutsPlatformService.balanceUpdatedSubject.next(this.selectedToken);
            });

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
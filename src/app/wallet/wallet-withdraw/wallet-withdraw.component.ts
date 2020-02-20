import { Component, Inject, Input, OnInit, ViewChild, NgZone } from '@angular/core';
import { FormControl, FormGroup, NgForm } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { InstrumentEscrowService } from '../../common/web3/instrument-escrow.service';
import { FSP_NAME, NutsPlatformService } from '../../common/web3/nuts-platform.service';

export interface WithdrawData {
  fspName: string,
  tokenName: string,
  amount: number,
}

@Component({
  selector: 'app-wallet-withdraw',
  templateUrl: './wallet-withdraw.component.html',
  styleUrls: ['./wallet-withdraw.component.scss']
})
export class WalletWithdrawComponent implements OnInit {
  @Input() private instrument: string;
  @ViewChild('form', { static: true }) private form: NgForm;
  private selectedToken = 'ETH';
  private instrumentEscrowBalance: number;
  private amountControl: FormControl;
  private withdrawForm: FormGroup;

  constructor(private dialog: MatDialog, private zone: NgZone,
    private nutsPlatformService: NutsPlatformService,
    private instrumentEscrowService: InstrumentEscrowService) { }

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
        this.dialog.open(WithdrawInitiatedDialog, {
          width: '90%',
          data: {
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

@Component({
  selector: 'withdraw-initiated-dialog',
  templateUrl: 'withdraw-initiated-dialog.html',
  styleUrls: ['./withdraw-initiated-dialog.scss'],
})
export class WithdrawInitiatedDialog {

  constructor(
    public dialogRef: MatDialogRef<WithdrawInitiatedDialog>,
    @Inject(MAT_DIALOG_DATA) public data: WithdrawData) { }
}

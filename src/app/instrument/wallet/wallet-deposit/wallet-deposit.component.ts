import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, NgForm } from '@angular/forms';
import { NutsPlatformService } from '../../../common/web3/nuts-platform.service';
import { InstrumentEscrowService } from '../../../common/web3/instrument-escrow.service';


@Component({
  selector: 'app-wallet-deposit',
  templateUrl: './wallet-deposit.component.html',
  styleUrls: ['./wallet-deposit.component.scss']
})
export class WalletDepositComponent implements OnInit {
  @Input() private instrument: string;
  @ViewChild('form', { static: true }) private form: NgForm;
  private selectedToken = 'ETH';
  private accountBalance: number;
  private showApprove = false;
  private amountControl: FormControl;
  private depositFormGroup: FormGroup;

  constructor(private nutsPlatformService: NutsPlatformService, private instrumentEscrowService: InstrumentEscrowService) { }

  ngOnInit() {
    this.amountControl = new FormControl('', this.validBalance.bind(this));
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

  async submit() {
    console.log(this.amountControl);
    console.log(this.depositFormGroup);
    if (!this.depositFormGroup.valid) {
      return;
    }
    if (this.showApprove) {
      await this.instrumentEscrowService.approve(this.instrument, this.selectedToken, this.amountControl.value);
      this.showApprove = false;
    } else {
      if (this.selectedToken === 'ETH') {
        await this.instrumentEscrowService.depositETH(this.instrument, this.amountControl.value);
      } else {
        await this.instrumentEscrowService.depositToken(this.instrument, this.selectedToken, this.amountControl.value);
      }
      this.form.resetForm();
      this.nutsPlatformService.balanceUpdatedSubject.next(this.selectedToken);
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
    if ((this.selectedToken === 'ETH' && Number.isNaN(control.value)) || Number(control.value) <= 0) {
      return { 'nonPositiveAmount': true };
    }
    if (this.selectedToken !== 'ETH' && !/^[1-9][0-9]*$/.test(control.value)) {
      return { 'nonIntegerAmount': true };
    }
    return null;
  }
}

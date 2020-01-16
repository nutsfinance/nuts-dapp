import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { FormControl, NgForm, FormGroup } from '@angular/forms';

import { NutsPlatformService } from '../../../common/web3/nuts-platform.service';
import { InstrumentEscrowService } from '../../../common/web3/instrument-escrow.service';

@Component({
  selector: 'app-wallet-withdraw',
  templateUrl: './wallet-withdraw.component.html',
  styleUrls: ['./wallet-withdraw.component.scss']
})
export class WalletWithdrawComponent implements OnInit {
  @Input() private instrument: string;
  @ViewChild('form', {static: true}) private form: NgForm;
  private selectedToken = 'ETH';
  private instrumentEscrowBalance: number;
  private amountControl: FormControl;
  private withdrawForm: FormGroup;

  constructor(private nutsPlatformService: NutsPlatformService, private instrumentEscrowService: InstrumentEscrowService) { }

  ngOnInit() {
    this.amountControl = new FormControl('', this.validBalance.bind(this));
    this.withdrawForm = new FormGroup({amount: this.amountControl});
  }

  onTokenSelected(token: string) {
    this.amountControl.reset();
    this.selectedToken = token;
  }

  setMaxAmount() {
    this.withdrawForm.patchValue({amount: this.instrumentEscrowBalance});
  }

  async withdraw() {
    console.log(this.withdrawForm);
    if (!this.withdrawForm.valid) {
      return;
    }
    if (this.selectedToken === 'ETH') {
      await this.instrumentEscrowService.withdrawETH(this.instrument, this.amountControl.value);
    } else {
      await this.instrumentEscrowService.withdrawToken(this.instrument, this.selectedToken, this.amountControl.value);
    }
    this.form.resetForm();
    this.nutsPlatformService.balanceUpdatedSubject.next(this.selectedToken);
  }

  validBalance(control: FormControl): {[s: string]: boolean} {
    if (!control.value) {
      return {'required': true};
    }
    if (this.instrumentEscrowBalance < Number(control.value)) {
      return {'insufficientBalance': true};
    }
    if ((this.selectedToken === 'ETH' && Number.isNaN(control.value)) || Number(control.value) <= 0) {
      return {'nonPositiveAmount': true};
    }
    if (this.selectedToken !== 'ETH' && !/^[1-9][0-9]*$/.test(control.value)) {
      return {'nonIntegerAmount': true};
    }
  }
}

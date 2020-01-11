import { Component, OnInit, Input } from '@angular/core';

import { NutsPlatformService } from '../../../common/web3/nuts-platform.service';
import { FormControl, NgForm, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-wallet-withdraw',
  templateUrl: './wallet-withdraw.component.html',
  styleUrls: ['./wallet-withdraw.component.scss']
})
export class WalletWithdrawComponent implements OnInit {
  @Input() private instrument: string;
  private selectedToken = 'ETH';
  private instrumentEscrowBalance: number;
  private amountControl: FormControl;
  private withdrawForm: FormGroup;

  constructor(private nutsPlatformService: NutsPlatformService) { }

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

  async withdraw(form: NgForm) {
    console.log(this.withdrawForm);
    if (!this.withdrawForm.valid) {
      return;
    }
    if (this.selectedToken === 'ETH') {
      await this.nutsPlatformService.withdrawETH(this.instrument, this.amountControl.value);
    } else {
      await this.nutsPlatformService.withdrawToken(this.instrument, this.selectedToken, this.amountControl.value);
    }
    form.resetForm();
    this.nutsPlatformService.balanceUpdatedSubject.next(this.selectedToken);
  }

  validBalance(control: FormControl): {[s: string]: boolean} {
    if (!control.value) {
      return {'required': true};
    }
    if (this.instrumentEscrowBalance < Number(control.value)) {
      return {'insufficientBalance': true};
    }
    if (Number(control.value) <= 0) {
      return {'nonPositiveAmount': true};
    }
    if (this.selectedToken !== 'ETH' && !/^[1-9][0-9]*$/.test(control.value)) {
      return {'nonIntegerAmount': true};
    }
  }
}

import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { NutsPlatformService } from '../../../common/web3/nuts-platform.service';

@Component({
  selector: 'app-wallet-deposit',
  templateUrl: './wallet-deposit.component.html',
  styleUrls: ['./wallet-deposit.component.scss']
})
export class WalletDepositComponent implements OnInit {
  @Input() private instrument: string;
  private selectedToken = 'ETH';
  private accountBalance: number;
  private showApprove = false;
  private amountControl: FormControl;
  private depositForm: FormGroup;

  constructor(private nutsPlatformService: NutsPlatformService) { }

  ngOnInit() {
    this.amountControl = new FormControl('', [ Validators.required, this.validBalance.bind(this) ]);
    this.depositForm = new FormGroup({amount: this.amountControl});
  }

  onTokenSelected(token: string) {
    this.depositForm.reset();
    this.selectedToken = token;
    this.showApprove = this.selectedToken !== 'ETH';
  }

  setMaxAmount() {
    this.depositForm.patchValue({amount: this.accountBalance});
  }

  async submit() {
    console.log(this.amountControl);
    console.log(this.depositForm);
    if (!this.depositForm.valid) {
      return;
    }
    if (this.showApprove) {
      await this.nutsPlatformService.approve(this.instrument, this.selectedToken, this.amountControl.value);
      this.showApprove = false;
    } else {
      if (this.selectedToken === 'ETH') {
        await this.nutsPlatformService.depositETH(this.instrument, this.amountControl.value);
      } else {
        await this.nutsPlatformService.depositToken(this.instrument, this.selectedToken, this.amountControl.value);
      }
      this.depositForm.reset();
      this.nutsPlatformService.balanceUpdatedSubject.next(this.selectedToken);
    }
  }

  validBalance(control: FormControl): {[s: string]: boolean} {
    // Let Validators.required handle the empty input.
    if (!control.value) {
      return null;
    }
    if (this.accountBalance < Number(control.value)) {
      return {'insufficientBalance': true};
    } else if (Number(control.value) <= 0) {
      return {'nonPositiveAmount': true};
    } else if (this.selectedToken !== 'ETH' && !/^[1-9][0-9]*$/.test(control.value)) {
      return {'nonIntegerAmount': true};
    }
    return null;
  }
}

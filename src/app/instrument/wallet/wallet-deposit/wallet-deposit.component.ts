import {Component, Input, OnInit} from '@angular/core';
import {FormControl, FormGroup, NgForm} from '@angular/forms';
import {NutsPlatformService} from '../../../common/web3/nuts-platform.service';


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

  constructor(private nutsPlatformService: NutsPlatformService) {}

  ngOnInit() {
    this.amountControl = new FormControl('', this.validBalance.bind(this));
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

  async submit(form: NgForm) {
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
      form.resetForm();
      this.nutsPlatformService.balanceUpdatedSubject.next(this.selectedToken);
    }
  }

  validBalance(control: FormControl): {[s: string]: boolean} {
    if (!control.value) {
      return {'required': true};
    }
    if (this.accountBalance < Number(control.value)) {
      return {'insufficientBalance': true};
    }
    if (Number(control.value) <= 0) {
      return {'nonPositiveAmount': true};
    }
    if (this.selectedToken !== 'ETH' && !/^[1-9][0-9]*$/.test(control.value)) {
      return {'nonIntegerAmount': true};
    }
    return null;
  }
}

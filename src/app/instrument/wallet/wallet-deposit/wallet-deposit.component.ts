import { Component, OnInit, Input } from '@angular/core';

import { NutsPlatformService } from '../../../common/web3/nuts-platform.service';

@Component({
  selector: 'app-wallet-deposit',
  templateUrl: './wallet-deposit.component.html',
  styleUrls: ['./wallet-deposit.component.scss']
})
export class WalletDepositComponent implements OnInit {
  @Input() private instrument: string;
  private selectedToken = 'ETH';
  private amount: number;
  private showApprove = false;
  private showError = false;

  constructor(private nutsPlatformService: NutsPlatformService) { }

  ngOnInit() {
  }

  onTokenSelected(token: string) {
    this.selectedToken = token;
    this.showApprove = this.selectedToken !== 'ETH';
  }

  async approve() {
    if (this.amount === undefined || this.amount === 0) {
      this.showError = true;
      return;
    }
    await this.nutsPlatformService.approve(this.instrument, this.selectedToken, this.amount);
    this.showApprove = false;
  }

  async deposit() {
    console.log(this.amount);
    if (this.amount === undefined || this.amount === 0) {
      this.showError = true;
      return;
    }
    if (this.selectedToken === 'ETH') {
      await this.nutsPlatformService.depositETH(this.instrument, this.amount);
    } else {
      await this.nutsPlatformService.depositToken(this.instrument, this.selectedToken, this.amount);
    }
    this.amount = undefined;
    this.nutsPlatformService.balanceUpdatedSubject.next(this.selectedToken);
  }

  onAmountChange() {
    this.showError = false;
  }
}

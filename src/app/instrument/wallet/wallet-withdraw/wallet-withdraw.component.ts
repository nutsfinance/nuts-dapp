import { Component, OnInit, Input } from '@angular/core';

import { NutsPlatformService } from '../../../common/web3/nuts-platform.service';

@Component({
  selector: 'app-wallet-withdraw',
  templateUrl: './wallet-withdraw.component.html',
  styleUrls: ['./wallet-withdraw.component.scss']
})
export class WalletWithdrawComponent implements OnInit {
  @Input() private instrument: string;
  private selectedToken = 'ETH';
  private amount: number;

  constructor(private nutsPlatformService: NutsPlatformService) { }

  ngOnInit() {
  }

  onTokenSelected(token: string) {
    this.selectedToken = token;
  }

  async withdraw() {
    if (this.selectedToken === 'ETH') {
      await this.nutsPlatformService.withdrawETH(this.instrument, this.amount);
    } else {
      await this.nutsPlatformService.withdrawToken(this.instrument, this.selectedToken, this.amount);
    }
    this.amount = 0;
    this.nutsPlatformService.balanceUpdatedSubject.next(this.selectedToken);
  }
}

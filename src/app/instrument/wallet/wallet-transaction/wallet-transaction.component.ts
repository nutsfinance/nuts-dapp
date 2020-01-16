import { Component, OnInit, OnDestroy, Input, NgZone } from '@angular/core';

import { NutsPlatformService, WalletTransaction } from '../../../common/web3/nuts-platform.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-wallet-transaction',
  templateUrl: './wallet-transaction.component.html',
  styleUrls: ['./wallet-transaction.component.scss']
})
export class WalletTransactionComponent implements OnInit {
  @Input() private instrument: string;
  private columns: string[] = ['date', 'action', 'amount'];
  private walletTransactions: WalletTransaction[] = [];
  private networkSubscription: Subscription;
  private accountSubscription: Subscription;
  private balanceSubscription: Subscription;

  constructor(private nutsPlatformService: NutsPlatformService, private zone: NgZone) { }

  async ngOnInit() {
    this.walletTransactions = await this.nutsPlatformService.getWalletTransactions(this.instrument);
    this.networkSubscription = this.nutsPlatformService.currentNetworkSubject.subscribe(() => {
      this.updateWalletTransactions();
    });
    this.accountSubscription = this.nutsPlatformService.currentAccountSubject.subscribe(() => {
      this.updateWalletTransactions();
    });
    this.balanceSubscription = this.nutsPlatformService.balanceUpdatedSubject.subscribe((token) => {
      this.updateWalletTransactions();
    });
  }

  ngOnDestroy() {
    if (this.networkSubscription) {
      this.networkSubscription.unsubscribe();
      this.accountSubscription.unsubscribe();
      this.balanceSubscription.unsubscribe();
    }
  }

  private async updateWalletTransactions() {
    const transactions = await this.nutsPlatformService.getWalletTransactions(this.instrument);
    this.zone.run(() => {
      this.walletTransactions = transactions;
    });
    console.log(transactions);
  }
}

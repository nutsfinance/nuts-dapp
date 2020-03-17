import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, NgZone } from '@angular/core';
import { Subscription } from 'rxjs';

import { NutsPlatformService } from '../../common/web3/nuts-platform.service';
import { InstrumentEscrowService, WalletTransaction } from '../../common/web3/instrument-escrow.service';

@Component({
  selector: 'app-wallet-transaction',
  templateUrl: './wallet-transaction.component.html',
  styleUrls: ['./wallet-transaction.component.scss']
})
export class WalletTransactionComponent implements OnInit, OnDestroy {
  public columns: string[] = ['date', 'action', 'amount'];
  public walletTransactions: WalletTransaction[] = [];

  @Input() private instrument: string;
  @Output() private updatePanel = new EventEmitter<string>();

  private networkSubscription: Subscription;
  private accountSubscription: Subscription;
  private balanceSubscription: Subscription;

  constructor(private nutsPlatformService: NutsPlatformService, private instrumentEscrowService: InstrumentEscrowService,
              private zone: NgZone) { }

  ngOnInit() {
    this.instrumentEscrowService.getWalletTransactions(this.instrument).then((transactions) => {
      this.walletTransactions = transactions;
    });
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
    this.networkSubscription.unsubscribe();
    this.accountSubscription.unsubscribe();
    this.balanceSubscription.unsubscribe();
  }

  deposit() {
    this.updatePanel.emit('deposit');
  }

  private async updateWalletTransactions() {
    const transactions = await this.instrumentEscrowService.getWalletTransactions(this.instrument);
    this.zone.run(() => {
      this.walletTransactions = transactions;
    });
    console.log(transactions);
  }
}

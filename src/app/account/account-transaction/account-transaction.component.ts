import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, NgZone } from '@angular/core';
import { Subscription } from 'rxjs';

import { NutsPlatformService } from '../../common/web3/nuts-platform.service';
import { InstrumentEscrowService, WalletTransaction } from '../../common/web3/instrument-escrow.service';
import { UserBalanceService } from 'src/app/common/web3/user-balance.service';

@Component({
  selector: 'app-account-transaction',
  templateUrl: './account-transaction.component.html',
  styleUrls: ['./account-transaction.component.scss']
})
export class AccountTransactionComponent implements OnInit, OnDestroy {
  public columns: string[] = ['date', 'action', 'amount'];
  public walletTransactions: WalletTransaction[] = [];

  @Input() private instrument: string;
  @Output() private updatePanel = new EventEmitter<string>();

  private networkSubscription: Subscription;
  private accountSubscription: Subscription;
  private userBalanceSubscription: Subscription;

  constructor(private nutsPlatformService: NutsPlatformService, private instrumentEscrowService: InstrumentEscrowService,
      private userBalanceService: UserBalanceService, private zone: NgZone) { }

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

    // If the user balance is updated, it's likely that a new transaction has confirmed!
    this.userBalanceSubscription = this.userBalanceService.userBalanceSubject.subscribe(userBalance => {
      console.log('Wallet transaction: User balance updated', userBalance);
      this.updateWalletTransactions();
    });
  }

  ngOnDestroy() {
    this.networkSubscription.unsubscribe();
    this.accountSubscription.unsubscribe();
    this.userBalanceSubscription.unsubscribe();
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

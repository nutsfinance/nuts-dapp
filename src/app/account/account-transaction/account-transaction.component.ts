import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, NgZone } from '@angular/core';
import { Subscription } from 'rxjs';

import { NutsPlatformService } from '../../common/web3/nuts-platform.service';
import { AccountService, AccountTransaction } from '../../common/web3/account.service';
import { AccountBalanceService } from 'src/app/common/web3/account-balance.service';

@Component({
  selector: 'app-account-transaction',
  templateUrl: './account-transaction.component.html',
  styleUrls: ['./account-transaction.component.scss']
})
export class AccountTransactionComponent implements OnInit, OnDestroy {
  public columns: string[] = ['date', 'action', 'amount'];
  public accountTransactions: AccountTransaction[] = [];

  @Input() private instrument: string;
  @Output() private updatePanel = new EventEmitter<string>();

  private networkSubscription: Subscription;
  private accountSubscription: Subscription;
  private accountBalancesSubscription: Subscription;

  constructor(private nutsPlatformService: NutsPlatformService, private accountService: AccountService,
      private accountBalanceService: AccountBalanceService, private zone: NgZone) { }

  ngOnInit() {
    this.updateAccountTransactions();
    this.networkSubscription = this.nutsPlatformService.currentNetworkSubject.subscribe(() => {
      this.updateAccountTransactions();
    });
    this.accountSubscription = this.nutsPlatformService.currentAccountSubject.subscribe(() => {
      this.updateAccountTransactions();
    });

    // If the user balance is updated, it's likely that a new transaction has confirmed!
    this.accountBalancesSubscription = this.accountBalanceService.accountBalancesSubject.subscribe(userBalance => {
      console.log('Wallet transaction: Account balance updated', userBalance);
      this.updateAccountTransactions();
    });
  }

  ngOnDestroy() {
    this.networkSubscription.unsubscribe();
    this.accountSubscription.unsubscribe();
    this.accountBalancesSubscription.unsubscribe();
  }

  deposit() {
    this.updatePanel.emit('deposit');
  }

  private async updateAccountTransactions() {
    const transactions = await this.accountService.getAccountTransactions(this.instrument);
    console.log('Transactions', transactions);
    this.zone.run(() => {
      this.accountTransactions = transactions;
    });
    console.log('Account transactions updated', transactions);
  }
}

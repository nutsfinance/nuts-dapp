import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, NgZone } from '@angular/core';
import { NutsPlatformService } from '../web3/nuts-platform.service';

import { Subscription } from 'rxjs';
import { AccountBalanceService } from '../web3/account-balance.service';

@Component({
  selector: 'app-wallet-balance',
  templateUrl: './wallet-balance.component.html',
  styleUrls: ['./wallet-balance.component.scss']
})
export class WalletBalanceComponent implements OnInit, OnDestroy, OnChanges {
  @Input() public selectedToken: string;
  @Output() public balanceUpdated = new EventEmitter<number>();
  public tokenBalance: number;
  
  private networkSubscription: Subscription;
  private accountSubscription: Subscription;
  private accountBalancesSubscription: Subscription;

  constructor(private nutsPlatformService_: NutsPlatformService, private userBalanceService: AccountBalanceService,
    private zone: NgZone) { }

  ngOnInit() {
    this.updateTokenBalance();
    this.networkSubscription = this.nutsPlatformService_.currentNetworkSubject.subscribe(() => {
      this.updateTokenBalance();
    });
    this.accountSubscription = this.nutsPlatformService_.currentAccountSubject.subscribe(() => {
      this.updateTokenBalance();
    });
    // When user balance changes, it's likely that user balance is changed as well!
    this.accountBalancesSubscription = this.userBalanceService.accountBalancesSubject.subscribe(accountBalances => {
      console.log('Wallet balance: Account balances updated', accountBalances);
      this.updateTokenBalance();
    });
  }

  ngOnDestroy() {
    this.networkSubscription.unsubscribe();
    this.accountSubscription.unsubscribe();
    this.accountBalancesSubscription.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.selectedToken = changes.selectedToken.currentValue;
    this.updateTokenBalance();
  }

  private updateTokenBalance() {
    this.nutsPlatformService_.getWalletBalance(this.selectedToken).then(balance => {
      this.zone.run(() => {
        console.log('Wallet balance updated', this.selectedToken, balance);
        this.tokenBalance = balance;
        this.balanceUpdated.emit(balance);
      });
    });
  }
}

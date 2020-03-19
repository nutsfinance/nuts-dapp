import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, NgZone } from '@angular/core';
import { Subscription } from 'rxjs';

import { NutsPlatformService } from '../web3/nuts-platform.service';
import { AccountService } from '../web3/account.service';
import { AccountBalanceService } from '../web3/account-balance.service';

@Component({
  selector: 'app-account-balance',
  templateUrl: './account-balance.component.html',
  styleUrls: ['./account-balance.component.scss']
})
export class AccountBalanceComponent implements OnInit, OnChanges, OnDestroy {
  @Input() public selectedToken: string;
  @Input() public instrument: string;
  @Output() public balanceUpdated = new EventEmitter<number>();
  public tokenBalance: number;
  
  private networkSubscription: Subscription;
  private accountSubscription: Subscription;
  private accountBalancesSubscription: Subscription;

  constructor(private nutsPlatformService_: NutsPlatformService, private instrumentEscrowService: AccountService,
    private userBalanceService: AccountBalanceService, private zone: NgZone) { }

  ngOnInit() {
    this.networkSubscription = this.nutsPlatformService_.currentNetworkSubject.subscribe(() => {
      // console.log('Account balance: network updated');
      this.updateTokenBalance();
    });
    this.accountSubscription = this.nutsPlatformService_.currentAccountSubject.subscribe(() => {
      // console.log('Account balance: account updated');
      this.updateTokenBalance();
    });
    this.accountBalancesSubscription = this.userBalanceService.accountBalancesSubject.subscribe(userBalance => {
      console.log('Account balance: Account balances updated', userBalance);
      this.updateTokenBalance();
    });
  }

  ngOnDestroy() {
    this.networkSubscription.unsubscribe();
    this.accountSubscription.unsubscribe();
    this.accountBalancesSubscription.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.updateTokenBalance();
  }

  private updateTokenBalance() {
    this.instrumentEscrowService.getWalletBalance(this.instrument, this.selectedToken).then(balance => {
      this.zone.run(() => {
        this.tokenBalance = balance;
        this.balanceUpdated.next(balance);
      });
    });
  }

}

import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, NgZone } from '@angular/core';
import { NutsPlatformService } from '../web3/nuts-platform.service';

import { Subscription } from 'rxjs';
import { UserBalanceService } from '../web3/user-balance.service';

@Component({
  selector: 'app-account-balance',
  templateUrl: './account-balance.component.html',
  styleUrls: ['./account-balance.component.scss']
})
export class AccountBalanceComponent implements OnInit, OnDestroy, OnChanges {
  @Input() public selectedToken: string;
  @Output() public balanceUpdated = new EventEmitter<number>();
  public tokenBalance: number;
  
  private networkSubscription: Subscription;
  private accountSubscription: Subscription;
  private userBalanceSubscription: Subscription;

  constructor(private nutsPlatformService_: NutsPlatformService, private userBalanceService: UserBalanceService,
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
    this.userBalanceSubscription = this.userBalanceService.userBalanceSubject.subscribe(userBalance => {
      console.log('Account balance: User balance updated', userBalance);
      this.updateTokenBalance();
    });
  }

  ngOnDestroy() {
    this.networkSubscription.unsubscribe();
    this.accountSubscription.unsubscribe();
    this.userBalanceSubscription.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.selectedToken = changes.selectedToken.currentValue;
    this.updateTokenBalance();
  }

  private updateTokenBalance() {
    this.nutsPlatformService_.getAccountBalance(this.selectedToken).then(balance => {
      this.zone.run(() => {
        this.tokenBalance = balance;
        this.balanceUpdated.emit(balance);
      });
    });
  }
}

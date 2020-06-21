import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, NgZone } from '@angular/core';
import { NutsPlatformService } from '../../web3/nuts-platform.service';

import { Subscription } from 'rxjs';
import { AccountService } from '../../../account/account.service';
import { TokenService } from '../token.service';

@Component({
  selector: 'app-wallet-balance',
  templateUrl: './wallet-balance.component.html',
  styleUrls: ['./wallet-balance.component.scss']
})
export class WalletBalanceComponent implements OnInit, OnDestroy, OnChanges {
  @Input() public tokenAddress: string;
  @Output() public balanceUpdated = new EventEmitter<number>();
  public tokenBalance: number;
  
  private networkSubscription: Subscription;
  private accountSubscription: Subscription;
  private accountBalancesSubscription: Subscription;

  constructor(private nutsPlatformService_: NutsPlatformService, private accountService: AccountService,
    private tokenService: TokenService, private zone: NgZone) { }

  ngOnInit() {
    this.updateTokenBalance();
    this.networkSubscription = this.nutsPlatformService_.currentNetworkSubject.subscribe(() => {
      this.updateTokenBalance();
    });
    this.accountSubscription = this.nutsPlatformService_.currentAccountSubject.subscribe(() => {
      this.updateTokenBalance();
    });
    // When user balance changes, it's likely that user balance is changed as well!
    this.accountBalancesSubscription = this.accountService.accountsBalanceSubject.subscribe(_ => {
      this.updateTokenBalance();
    });
  }

  ngOnDestroy() {
    this.networkSubscription.unsubscribe();
    this.accountSubscription.unsubscribe();
    this.accountBalancesSubscription.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.tokenAddress = changes.tokenAddress.currentValue;
    this.updateTokenBalance();
  }

  private updateTokenBalance() {
    this.tokenService.getWalletBalance(this.tokenAddress).then(balance => {
      this.zone.run(() => {
        this.tokenBalance = balance;
        this.balanceUpdated.emit(balance);
      });
    });
  }
}

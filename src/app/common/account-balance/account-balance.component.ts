import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, NgZone } from '@angular/core';
import { NutsPlatformService } from '../web3/nuts-platform.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-account-balance',
  templateUrl: './account-balance.component.html',
  styleUrls: ['./account-balance.component.scss']
})
export class AccountBalanceComponent implements OnInit, OnDestroy, OnChanges {
  @Input() private selectedToken: string;
  private tokenBalance: number;
  private networkSubscription: Subscription;
  private accountSubscription: Subscription;

  constructor(private nutsPlatformService_: NutsPlatformService, private zone: NgZone) { }

  ngOnInit() {
    this.updateTokenBalance();
    this.networkSubscription = this.nutsPlatformService_.currentNetworkSubject.subscribe(() => {
      this.updateTokenBalance();
    });
    this.accountSubscription = this.nutsPlatformService_.currentAccountSubject.subscribe(() => {
      this.updateTokenBalance();
    });
  }

  ngOnDestroy() {
    this.networkSubscription.unsubscribe();
    this.accountSubscription.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.selectedToken = changes.selectedToken.currentValue;
    this.updateTokenBalance();
  }

  private updateTokenBalance() {
    this.nutsPlatformService_.getTokenBalance(this.selectedToken).then(balance => {
      this.zone.run(() => {
        this.tokenBalance = balance;
      });
    });
  }
}

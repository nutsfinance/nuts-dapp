import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { NutsPlatformService } from '../web3/nuts-platform.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-account-balance',
  templateUrl: './account-balance.component.html',
  styleUrls: ['./account-balance.component.scss']
})
export class AccountBalanceComponent implements OnInit {
  @Input() private selectedToken: string;
  private tokenBalance: number;
  private networkSubscription: Subscription;
  private accountSubscription: Subscription;

  constructor(private nutsPlatformService_: NutsPlatformService) { }

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

  private updateTokenBalance() {
    this.nutsPlatformService_.getEthBalance().then(balance => {
      console.log(balance);
      this.tokenBalance = Number(balance);
    });
  }
}

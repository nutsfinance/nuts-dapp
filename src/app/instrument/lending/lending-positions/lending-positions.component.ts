import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { NutsPlatformService } from '../../../common/web3/nuts-platform.service';
import { LendingIssuanceModel } from '../../../common/model/lending-issuance.model';
 
@Component({
  selector: 'app-lending-positions',
  templateUrl: './lending-positions.component.html',
  styleUrls: ['./lending-positions.component.scss']
})
export class LendingPositionsComponent implements OnInit, OnDestroy {
  private selectedTab = 'all';
  private columns: string[] = ['position', 'role', 'status', 'amount', 'expiry'];
  private currentAccount: string;
  private lendingIssuances: LendingIssuanceModel[] = [];
  
  private accountUpdatedSubscription: Subscription;
  private lendingIssuancesUpdatedSubscription: Subscription;

  constructor(private nutsPlatformService: NutsPlatformService) { }

  ngOnInit() {
    this.currentAccount = this.nutsPlatformService.currentAccount;
    // Filters on maker and taker
    this.updateLendingIssuances();
    this.lendingIssuancesUpdatedSubscription = this.nutsPlatformService.lendingIssuancesUpdatedSubject.subscribe(_ => {
      this.updateLendingIssuances();
    });
    this.accountUpdatedSubscription = this.nutsPlatformService.currentAccountSubject.subscribe(_ => {
      this.updateLendingIssuances();
    });
  }

  ngOnDestroy() {
    this.lendingIssuancesUpdatedSubscription.unsubscribe();
    this.accountUpdatedSubscription.unsubscribe();
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
  }

  updateLendingIssuances() {
    console.log('Update lending positions');
    this.lendingIssuances = this.nutsPlatformService.lendingIssuances.filter(issuance => {
      return issuance.makerAddress.toLowerCase() === this.currentAccount.toLowerCase() || 
      issuance.takerAddress.toLowerCase() === this.currentAccount.toLowerCase()
    });
    console.log(this.lendingIssuances);
  }
}

import { Component, OnDestroy, OnInit, NgZone } from '@angular/core';
import { Subscription } from 'rxjs';
import { LendingIssuanceDataSource } from '../lending-issuance.datasource';
import { NutsPlatformService } from '../../../common/web3/nuts-platform.service';


@Component({
  selector: 'app-lending-positions',
  templateUrl: './lending-positions.component.html',
  styleUrls: ['./lending-positions.component.scss']
})
export class LendingPositionsComponent implements OnInit, OnDestroy {
  private selectedTab = 'all';
  private currentAccount: string;
  private lendingIssuanceDataSource = new LendingIssuanceDataSource;
  private isActionRow = (_, item) => item.action;

  private accountUpdatedSubscription: Subscription;
  private lendingIssuancesUpdatedSubscription: Subscription;

  constructor(private nutsPlatformService: NutsPlatformService, private zone: NgZone) { }

  ngOnInit() {
    this.currentAccount = this.nutsPlatformService.currentAccount;
    // Filters on maker and taker
    this.updateLendingIssuances();
    this.lendingIssuancesUpdatedSubscription = this.nutsPlatformService.lendingIssuancesUpdatedSubject.subscribe(_ => {
      this.updateLendingIssuances();
    });
    this.accountUpdatedSubscription = this.nutsPlatformService.currentAccountSubject.subscribe(_ => {
      this.currentAccount = this.nutsPlatformService.currentAccount;
      this.updateLendingIssuances();
    });
  }

  ngOnDestroy() {
    this.lendingIssuancesUpdatedSubscription.unsubscribe();
    this.accountUpdatedSubscription.unsubscribe();
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
    this.updateLendingIssuances();
  }

  updateLendingIssuances() {
    this.zone.run(() => {
      const lendingIssuances = this.nutsPlatformService.lendingIssuances.filter(issuance => {
        let inState = true;
        if (this.selectedTab === 'engageable') {
          inState = issuance.state === 2;
        } else if (this.selectedTab === 'engaged') {
          inState = issuance.state === 3;
        } else if (this.selectedTab === 'inactive') {
          inState = issuance.state > 3;
        }
        const inPosition = issuance.makerAddress.toLowerCase() === this.currentAccount.toLowerCase() ||
          issuance.takerAddress.toLowerCase() === this.currentAccount.toLowerCase();
        return inState && inPosition;
      });
      this.lendingIssuanceDataSource.setData(lendingIssuances);
    });
  }
}
import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { NutsPlatformService } from '../../../common/web3/nuts-platform.service';
import { LendingIssuanceModel } from 'src/app/common/model/lending-issuance.model';
import { InstrumentService } from 'src/app/common/web3/instrument.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-lending-positions',
  templateUrl: './lending-positions.component.html',
  styleUrls: ['./lending-positions.component.scss']
})
export class LendingPositionsComponent implements OnInit, OnDestroy {
  public selectedTab = 'all';
  public currentAccount: string;
  public issuances: LendingIssuanceModel[] = [];
  
  private accountUpdatedSubscription: Subscription;
  private lendingIssuancesUpdatedSubscription: Subscription;
  private routeParamSubscription: Subscription;

  constructor(private nutsPlatformService: NutsPlatformService, private instrumentService: InstrumentService,
    private route: ActivatedRoute, private zone: NgZone) { }

  ngOnInit() {
    this.currentAccount = this.nutsPlatformService.currentAccount;
    // Filters on maker and taker
    this.updateLendingIssuances();
    this.lendingIssuancesUpdatedSubscription = this.instrumentService.lendingIssuancesUpdatedSubject.subscribe(_ => {
      this.updateLendingIssuances();
    });
    this.accountUpdatedSubscription = this.nutsPlatformService.currentAccountSubject.subscribe(_ => {
      this.currentAccount = this.nutsPlatformService.currentAccount;
      this.updateLendingIssuances();
    });
    this.selectedTab = this.route.snapshot.queryParams['tab'] || 'all';
    this.routeParamSubscription = this.route.queryParams.subscribe(queryParams => {
      this.selectedTab = queryParams['tab'] || 'all';
      this.updateLendingIssuances();
    });
  }

  ngOnDestroy() {
    this.lendingIssuancesUpdatedSubscription.unsubscribe();
    this.accountUpdatedSubscription.unsubscribe();
    this.routeParamSubscription.unsubscribe();
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
    this.updateLendingIssuances();
  }

  updateLendingIssuances() {
    this.zone.run(() => {
      const lendingIssuances = this.instrumentService.lendingIssuances
        .filter(issuance => {
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
        })
        .sort((l1, l2) => {
          return l1.state === l2.state ? l2.creationTimestamp - l1.creationTimestamp : l1.state - l2.state;
        });
      console.log('Filtered issuance', lendingIssuances.map(issuance => issuance.issuanceId));
      this.issuances = lendingIssuances;
    });
  }
}

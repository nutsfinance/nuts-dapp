import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { NutsPlatformService } from '../../../common/web3/nuts-platform.service';
import { ActivatedRoute } from '@angular/router';
import { IssuanceModel } from '../../issuance.model';
import { LendingService } from '../lending.service';

@Component({
  selector: 'app-lending-positions',
  templateUrl: './lending-positions.component.html',
  styleUrls: ['./lending-positions.component.scss']
})
export class LendingPositionsComponent implements OnInit, OnDestroy {
  public selectedTab = 'all';
  public issuances: IssuanceModel[] = [];

  private accountUpdatedSubscription: Subscription;
  private lendingIssuancesUpdatedSubscription: Subscription;
  private routeParamSubscription: Subscription;

  constructor(private nutsPlatformService: NutsPlatformService, private lendingService: LendingService,
    private route: ActivatedRoute, private zone: NgZone) { }

  ngOnInit() {
    // Filters on maker and taker
    this.updateLendingIssuances();
    this.lendingIssuancesUpdatedSubscription = this.lendingService.lendingIssuancesUpdated.subscribe(_ => {
      this.updateLendingIssuances();
    });
    this.accountUpdatedSubscription = this.nutsPlatformService.currentAccountSubject.subscribe(_ => {
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
    const currentAccount = this.nutsPlatformService.currentAccount.toLowerCase();
    this.zone.run(() => {
      const lendingIssuances = this.lendingService.lendingIssuances
        .filter(issuance => this.lendingService.isIssuanceInPosition(issuance, this.selectedTab))
        .sort((l1, l2) => {
          return l1.issuancestate === l2.issuancestate ? l2.issuancecreationtimestamp - l1.issuancecreationtimestamp : l1.issuancestate - l2.issuancestate;
        });
      console.log('Filtered issuance', lendingIssuances.map(issuance => issuance.issuanceid));
      this.issuances = lendingIssuances;
    });
  }
}

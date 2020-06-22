import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { NutsPlatformService } from '../../../common/web3/nuts-platform.service';
import { ActivatedRoute } from '@angular/router';
import { IssuanceModel } from '../../issuance.model';
import { BorrowingService } from '../borrowing.service';

@Component({
  selector: 'app-borrowing-positions',
  templateUrl: './borrowing-positions.component.html',
  styleUrls: ['./borrowing-positions.component.scss']
})
export class BorrowingPositionsComponent implements OnInit, OnDestroy {
  public selectedTab = 'all';
  public issuances: IssuanceModel[] = [];

  private accountUpdatedSubscription: Subscription;
  private borrowingIssuancesUpdatedSubscription: Subscription;
  private routeParamSubscription: Subscription;

  constructor(private nutsPlatformService: NutsPlatformService, private borrowingService: BorrowingService,
    private route: ActivatedRoute, private zone: NgZone) { }

  ngOnInit() {
    // Filters on maker and taker
    this.updateBorrowingIssuances();
    this.borrowingIssuancesUpdatedSubscription = this.borrowingService.borrowingIssuancesUpdated.subscribe(_ => {
      this.updateBorrowingIssuances();
    });
    this.accountUpdatedSubscription = this.nutsPlatformService.currentAccountSubject.subscribe(_ => {
      this.updateBorrowingIssuances();
    });
    this.selectedTab = this.route.snapshot.queryParams['tab'] || 'all';
    this.routeParamSubscription = this.route.queryParams.subscribe(queryParams => {
      this.selectedTab = queryParams['tab'] || 'all';
      this.updateBorrowingIssuances();
    });
  }

  ngOnDestroy() {
    this.borrowingIssuancesUpdatedSubscription.unsubscribe();
    this.accountUpdatedSubscription.unsubscribe();
    this.routeParamSubscription.unsubscribe();
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
    this.updateBorrowingIssuances();
  }

  updateBorrowingIssuances() {
    const currentAccount = this.nutsPlatformService.currentAccount.toLowerCase();
    this.zone.run(() => {
      const borrowingIssuances = this.borrowingService.borrowingIssuances
        .filter(issuance => this.borrowingService.isIssuanceInPosition(issuance, this.selectedTab))
        .sort((l1, l2) => {
          return l1.issuancestate === l2.issuancestate ? l2.issuancecreationtimestamp - l1.issuancecreationtimestamp : l1.issuancestate - l2.issuancestate;
        });
      console.log('Filtered issuance', borrowingIssuances.map(issuance => issuance.issuanceid));
      this.issuances = borrowingIssuances;
    });
  }
}

import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { NutsPlatformService } from '../../../common/web3/nuts-platform.service';
import { BorrowingIssuanceModel } from 'src/app/common/model/borrowing-issuance.model';
import { InstrumentService } from 'src/app/common/web3/instrument.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-borrowing-positions',
  templateUrl: './borrowing-positions.component.html',
  styleUrls: ['./borrowing-positions.component.scss']
})
export class BorrowingPositionsComponent implements OnInit {
  public selectedTab = 'all';
  public currentAccount: string;
  public issuances: BorrowingIssuanceModel[] = [];
  
  private accountUpdatedSubscription: Subscription;
  private borrowingIssuancesUpdatedSubscription: Subscription;
  private routeParamSubscription: Subscription;

  constructor(private nutsPlatformService: NutsPlatformService, private instrumentService: InstrumentService,
    private route: ActivatedRoute, private zone: NgZone) { }

  ngOnInit() {
    this.currentAccount = this.nutsPlatformService.currentAccount;
    // Filters on maker and taker
    this.updateBorrowingIssuances();
    this.borrowingIssuancesUpdatedSubscription = this.instrumentService.borrowingIssuancesUpdatedSubject.subscribe(_ => {
      this.updateBorrowingIssuances();
    });
    this.accountUpdatedSubscription = this.nutsPlatformService.currentAccountSubject.subscribe(_ => {
      this.currentAccount = this.nutsPlatformService.currentAccount;
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
    console.log('Borrowing issuance updated', this.instrumentService.borrowingIssuances.length);
    console.log(this.instrumentService.borrowingIssuances.map(issuance => issuance.issuanceId));
    this.zone.run(() => {
      const borrowingIssuances = this.instrumentService.borrowingIssuances
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
      console.log('Filtered issuance', borrowingIssuances.length);
      console.log(borrowingIssuances.map(issuance => issuance.issuanceId));
      this.issuances = borrowingIssuances;
    });
  }
}

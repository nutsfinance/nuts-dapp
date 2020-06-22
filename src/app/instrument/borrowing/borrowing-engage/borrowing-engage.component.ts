import { Component, OnDestroy, OnInit, NgZone } from '@angular/core';
import { Subscription } from 'rxjs';
import { NutsPlatformService } from '../../../common/web3/nuts-platform.service';
import { IssuanceModel, IssuanceState } from '../../issuance.model';
import { BorrowingService } from '../borrowing.service';

@Component({
  selector: 'app-borrowing-engage',
  templateUrl: './borrowing-engage.component.html',
  styleUrls: ['./borrowing-engage.component.scss']
})
export class BorrowingEngageComponent implements OnInit, OnDestroy {
  public issuances: IssuanceModel[] = [];
  
  private accountUpdatedSubscription: Subscription;
  private borrowingIssuancesUpdatedSubscription: Subscription;

  constructor(private nutsPlatformService: NutsPlatformService, private borrowingService: BorrowingService,
    private zone: NgZone) { }

  ngOnInit() {
    // Filters on maker and taker
    this.updateBorrowingIssuances();
    this.borrowingIssuancesUpdatedSubscription = this.borrowingService.borrowingIssuancesUpdated.subscribe(_ => {
      this.updateBorrowingIssuances();
    });
    this.accountUpdatedSubscription = this.nutsPlatformService.currentAccountSubject.subscribe(_ => {
      this.updateBorrowingIssuances();
    });
  }

  ngOnDestroy() {
    this.borrowingIssuancesUpdatedSubscription.unsubscribe();
    this.accountUpdatedSubscription.unsubscribe();
  }

  updateBorrowingIssuances() {
    const currentAccount = this.nutsPlatformService.currentAccount.toLowerCase();
    this.zone.run(() => {
      const borrowingIssuances = this.borrowingService.borrowingIssuances.filter(issuance => {
        // Issuances in Engageable state and the maker is not current user.
        return issuance.issuancestate === IssuanceState.Engageable && issuance.makeraddress.toLowerCase() !== currentAccount;
      });
      console.log('Engage: Filtered issuance', borrowingIssuances.map(issuance => issuance.issuanceid));
      this.issuances = borrowingIssuances;
    });
  }
}

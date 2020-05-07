import { Component, OnDestroy, OnInit, NgZone } from '@angular/core';
import { Subscription } from 'rxjs';
import { NutsPlatformService } from '../../../common/web3/nuts-platform.service';
import { BorrowingIssuanceModel } from 'src/app/common/model/borrowing-issuance.model';
import { InstrumentService } from 'src/app/common/web3/instrument.service';

@Component({
  selector: 'app-borrowing-engage',
  templateUrl: './borrowing-engage.component.html',
  styleUrls: ['./borrowing-engage.component.scss']
})
export class BorrowingEngageComponent implements OnInit {
  public currentAccount: string;
  public issuances: BorrowingIssuanceModel[] = [];
  
  private accountUpdatedSubscription: Subscription;
  private borrowingIssuancesUpdatedSubscription: Subscription;

  constructor(private nutsPlatformService: NutsPlatformService, private instrumentService: InstrumentService,
    private zone: NgZone) { }

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
  }

  ngOnDestroy() {
    this.borrowingIssuancesUpdatedSubscription.unsubscribe();
    this.accountUpdatedSubscription.unsubscribe();
  }

  updateBorrowingIssuances() {
    this.zone.run(() => {
      const borrowingIssuances = this.instrumentService.borrowingIssuances.filter(issuance => {
        // Issuances in Engageable state and the maker is not current user.
        return issuance.state === 2 && issuance.makerAddress.toLowerCase() !== this.currentAccount.toLowerCase();
      });
      console.log('Engage: Filtered issuance', borrowingIssuances.map(issuance => issuance.issuanceId));
      this.issuances = borrowingIssuances;
    });
  }

}

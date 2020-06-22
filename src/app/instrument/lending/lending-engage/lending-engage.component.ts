import { Component, OnDestroy, OnInit, NgZone } from '@angular/core';
import { Subscription } from 'rxjs';
import { NutsPlatformService } from '../../../common/web3/nuts-platform.service';
import { IssuanceModel, IssuanceState } from '../../issuance.model';
import { LendingService } from '../lending.service';

@Component({
  selector: 'app-lending-engage',
  templateUrl: './lending-engage.component.html',
  styleUrls: ['./lending-engage.component.scss']
})
export class LendingEngageComponent implements OnInit, OnDestroy {
  public issuances: IssuanceModel[] = [];
  
  private accountUpdatedSubscription: Subscription;
  private lendingIssuancesUpdatedSubscription: Subscription;

  constructor(private nutsPlatformService: NutsPlatformService, private lendingService: LendingService,
    private zone: NgZone) { }

  ngOnInit() {
    // Filters on maker and taker
    this.updateLendingIssuances();
    this.lendingIssuancesUpdatedSubscription = this.lendingService.lendingIssuancesUpdated.subscribe(_ => {
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

  updateLendingIssuances() {
    const currentAccount = this.nutsPlatformService.currentAccount.toLowerCase();
    this.zone.run(() => {
      const lendingIssuances = this.lendingService.lendingIssuances.filter(issuance => {
        // Issuances in Engageable state and the maker is not current user.
        return issuance.issuancestate === IssuanceState.Engageable && issuance.makeraddress.toLowerCase() !== currentAccount;
      });
      console.log('Engage: Filtered issuance', lendingIssuances.map(issuance => issuance.issuanceid));
      this.issuances = lendingIssuances;
    });
  }
}

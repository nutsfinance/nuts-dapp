import { Component, OnDestroy, OnInit, NgZone } from '@angular/core';
import { Subscription } from 'rxjs';
import { NutsPlatformService } from '../../../common/web3/nuts-platform.service';
import { LendingIssuanceModel } from 'src/app/common/model/lending-issuance.model';
import { InstrumentService } from 'src/app/common/web3/instrument.service';

@Component({
  selector: 'app-lending-engage',
  templateUrl: './lending-engage.component.html',
  styleUrls: ['./lending-engage.component.scss']
})
export class LendingEngageComponent implements OnInit, OnDestroy {
  private currentAccount: string;
  private issuances: LendingIssuanceModel[] = [];
  private accountUpdatedSubscription: Subscription;
  private lendingIssuancesUpdatedSubscription: Subscription;

  constructor(private nutsPlatformService: NutsPlatformService, private instrumentService: InstrumentService,
    private zone: NgZone) { }

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
  }

  ngOnDestroy() {
    this.lendingIssuancesUpdatedSubscription.unsubscribe();
    this.accountUpdatedSubscription.unsubscribe();
  }

  updateLendingIssuances() {
    this.zone.run(() => {
      const lendingIssuances = this.instrumentService.lendingIssuances.filter(issuance => {
        // Issuances in Engageable state and the maker is not current user.
        return issuance.state === 2 && issuance.makerAddress.toLowerCase() !== this.currentAccount.toLowerCase();
      });
      this.issuances = lendingIssuances;
    });
  }
}

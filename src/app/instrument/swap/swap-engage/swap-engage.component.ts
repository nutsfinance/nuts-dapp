import { Component, OnDestroy, OnInit, NgZone } from '@angular/core';
import { Subscription } from 'rxjs';
import { NutsPlatformService } from '../../../common/web3/nuts-platform.service';
import { IssuanceModel, IssuanceState } from '../../issuance.model';
import { SwapService } from '../swap.service';

@Component({
  selector: 'app-swap-engage',
  templateUrl: './swap-engage.component.html',
  styleUrls: ['./swap-engage.component.scss']
})
export class SwapEngageComponent implements OnInit, OnDestroy {
  public issuances: IssuanceModel[] = [];
  
  private accountUpdatedSubscription: Subscription;
  private swapIssuancesUpdatedSubscription: Subscription;

  constructor(private nutsPlatformService: NutsPlatformService, private swapService: SwapService,
    private zone: NgZone) { }

  ngOnInit() {
    // Filters on maker and taker
    this.updateSwapIssuances();
    this.swapIssuancesUpdatedSubscription = this.swapService.swapIssuancesUpdated.subscribe(_ => {
      this.updateSwapIssuances();
    });
    this.accountUpdatedSubscription = this.nutsPlatformService.currentAccountSubject.subscribe(_ => {
      this.updateSwapIssuances();
    });
  }

  ngOnDestroy() {
    this.swapIssuancesUpdatedSubscription.unsubscribe();
    this.accountUpdatedSubscription.unsubscribe();
  }

  updateSwapIssuances() {
    const currentAccount = this.nutsPlatformService.currentAccount.toLowerCase();
    this.zone.run(() => {
      const swapIssuances = this.swapService.swapIssuances.filter(issuance => {
        // Issuances in Engageable state and the maker is not current user.
        return issuance.issuancestate === IssuanceState.Engageable && issuance.makeraddress.toLowerCase() !== currentAccount;
      });
      console.log('Engage: Filtered issuance', swapIssuances.map(issuance => issuance.issuanceid));
      this.issuances = swapIssuances;
    });
  }
}

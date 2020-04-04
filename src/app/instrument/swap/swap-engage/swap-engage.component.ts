import { Component, OnDestroy, OnInit, NgZone } from '@angular/core';
import { Subscription } from 'rxjs';
import { NutsPlatformService } from '../../../common/web3/nuts-platform.service';
import { SwapIssuanceModel } from 'src/app/common/model/swap-issuance.model';
import { InstrumentService } from 'src/app/common/web3/instrument.service';

@Component({
  selector: 'app-swap-engage',
  templateUrl: './swap-engage.component.html',
  styleUrls: ['./swap-engage.component.scss']
})
export class SwapEngageComponent implements OnInit {
  public currentAccount: string;
  public issuances: SwapIssuanceModel[] = [];
  
  private accountUpdatedSubscription: Subscription;
  private swapIssuancesUpdatedSubscription: Subscription;

  constructor(private nutsPlatformService: NutsPlatformService, private instrumentService: InstrumentService,
    private zone: NgZone) { }

  ngOnInit() {
    this.currentAccount = this.nutsPlatformService.currentAccount;
    // Filters on maker and taker
    this.updateSwapIssuances();
    this.swapIssuancesUpdatedSubscription = this.instrumentService.swapIssuancesUpdatedSubject.subscribe(_ => {
      this.updateSwapIssuances();
    });
    this.accountUpdatedSubscription = this.nutsPlatformService.currentAccountSubject.subscribe(_ => {
      this.currentAccount = this.nutsPlatformService.currentAccount;
      this.updateSwapIssuances();
    });
  }

  ngOnDestroy() {
    this.swapIssuancesUpdatedSubscription.unsubscribe();
    this.accountUpdatedSubscription.unsubscribe();
  }

  updateSwapIssuances() {
    this.zone.run(() => {
      console.log('Engage: Swap issuance updated', this.instrumentService.swapIssuances.length);
      console.log(this.instrumentService.swapIssuances.map(issuance => issuance.issuanceId));
      const swapIssuances = this.instrumentService.swapIssuances.filter(issuance => {
        // Issuances in Engageable state and the maker is not current user.
        return issuance.state === 2 && issuance.makerAddress.toLowerCase() !== this.currentAccount.toLowerCase();
      });
      console.log('Engage: Filtered issuance', swapIssuances.length);
      console.log(swapIssuances.map(issuance => issuance.issuanceId));
      this.issuances = swapIssuances;
    });
  }
}

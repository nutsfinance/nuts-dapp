import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { NutsPlatformService } from '../../../common/web3/nuts-platform.service';
import { SwapIssuanceModel } from 'src/app/common/model/swap-issuance.model';
import { InstrumentService } from 'src/app/common/web3/instrument.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-swap-positions',
  templateUrl: './swap-positions.component.html',
  styleUrls: ['./swap-positions.component.scss']
})
export class SwapPositionsComponent implements OnInit {
  public selectedTab = 'all';
  public currentAccount: string;
  public issuances: SwapIssuanceModel[] = [];
  
  private accountUpdatedSubscription: Subscription;
  private swapIssuancesUpdatedSubscription: Subscription;
  private routeParamSubscription: Subscription;

  constructor(private nutsPlatformService: NutsPlatformService, private instrumentService: InstrumentService,
    private route: ActivatedRoute, private zone: NgZone) { }

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
    this.selectedTab = this.route.snapshot.queryParams['tab'] || 'all';
    this.routeParamSubscription = this.route.queryParams.subscribe(queryParams => {
      this.selectedTab = queryParams['tab'] || 'all';
      this.updateSwapIssuances();
    });
  }

  ngOnDestroy() {
    this.swapIssuancesUpdatedSubscription.unsubscribe();
    this.accountUpdatedSubscription.unsubscribe();
    this.routeParamSubscription.unsubscribe();
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
    this.updateSwapIssuances();
  }

  updateSwapIssuances() {
    console.log('Swap issuance updated', this.instrumentService.swapIssuances.length);
    console.log(this.instrumentService.swapIssuances.map(issuance => issuance.issuanceId));
    this.zone.run(() => {
      const swapIssuances = this.instrumentService.swapIssuances
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
      console.log('Filtered issuance', swapIssuances.length);
      console.log(swapIssuances.map(issuance => issuance.issuanceId));
      this.issuances = swapIssuances;
    });
  }}

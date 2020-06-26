import { Component, NgZone, OnDestroy, OnInit, AfterViewInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { NutsPlatformService } from '../../../common/web3/nuts-platform.service';
import { ActivatedRoute } from '@angular/router';
import { IssuanceModel } from '../../issuance.model';
import { SwapService } from '../swap.service';

@Component({
  selector: 'app-swap-positions',
  templateUrl: './swap-positions.component.html',
  styleUrls: ['./swap-positions.component.scss']
})
export class SwapPositionsComponent implements OnInit, OnDestroy, AfterViewInit {
  public selectedTab = 'all';
  public issuances: IssuanceModel[] = [];
  
  private accountUpdatedSubscription: Subscription;
  private swapIssuancesUpdatedSubscription: Subscription;
  private routeParamSubscription: Subscription;

  constructor(private nutsPlatformService: NutsPlatformService, private swapService: SwapService,
    private route: ActivatedRoute, private zone: NgZone) { }

  ngOnInit() {
    // Filters on maker and taker
    this.updateSwapIssuances();
    this.swapIssuancesUpdatedSubscription = this.swapService.swapIssuancesUpdated.subscribe(_ => {
      this.updateSwapIssuances();
    });
    this.accountUpdatedSubscription = this.nutsPlatformService.currentAccountSubject.subscribe(_ => {
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

  ngAfterViewInit() {
    const fragment = this.route.snapshot.fragment;
    try {
      const element = document.querySelector(`#${fragment}`);
      if (element) {
        element.scrollIntoView();
      }
    } catch (error) {
      console.error(error);
    }
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
    this.updateSwapIssuances();
  }

  updateSwapIssuances() {
    console.log(this.swapService.swapIssuances);
    const currentAccount = this.nutsPlatformService.currentAccount.toLowerCase();
    this.zone.run(() => {
      const swapIssuances = this.swapService.swapIssuances
        .filter(issuance => this.swapService.isIssuanceInPosition(issuance, this.selectedTab))
        .sort((l1, l2) => {
          return l1.issuancestate === l2.issuancestate ? l2.issuancecreationtimestamp - l1.issuancecreationtimestamp : l1.issuancestate - l2.issuancestate;
        });
      console.log('Filtered issuance', swapIssuances.map(issuance => issuance.issuanceid));
      this.issuances = swapIssuances;
    });
  }}

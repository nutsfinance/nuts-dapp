import {DataSource} from '@angular/cdk/table';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject, Subscription} from 'rxjs';
import {LendingIssuanceModel} from '../../../common/model/lending-issuance.model';
import {NutsPlatformService} from '../../../common/web3/nuts-platform.service';


@Component({
  selector: 'app-lending-positions',
  templateUrl: './lending-positions.component.html',
  styleUrls: ['./lending-positions.component.scss']
})
export class LendingPositionsComponent implements OnInit, OnDestroy {
  private selectedTab = 'all';
  private columns: string[] = ['position', 'role', 'status', 'amount', 'expiry'];
  private currentAccount: string;
  private lendingIssuanceDataSource = new LendingIssuanceDataSource;
  private isActionRow = (_, item) => item.action;

  private accountUpdatedSubscription: Subscription;
  private lendingIssuancesUpdatedSubscription: Subscription;

  constructor(private nutsPlatformService: NutsPlatformService) {}

  ngOnInit() {
    this.currentAccount = this.nutsPlatformService.currentAccount;
    // Filters on maker and taker
    this.updateLendingIssuances();
    this.lendingIssuancesUpdatedSubscription = this.nutsPlatformService.lendingIssuancesUpdatedSubject.subscribe(_ => {
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

  selectTab(tab: string) {
    this.selectedTab = tab;
    this.updateLendingIssuances();
  }

  updateLendingIssuances() {
    const lendingIssuances = this.nutsPlatformService.lendingIssuances.filter(issuance => {
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
    });
    this.lendingIssuanceDataSource.setData(lendingIssuances);
  }
}

class LendingIssuanceDataSource implements DataSource<any> {

  private lendingIssuanceSubject = new BehaviorSubject<any>([]);

  setData(lendingIssuances: LendingIssuanceModel[]) {
    const splittedData = [];
    lendingIssuances.forEach(issuance => {
      splittedData.push(issuance);
      splittedData.push({issuanceId: issuance.issuanceId, action: true});
    });

    this.lendingIssuanceSubject.next(splittedData);
  }

  connect() {
    return this.lendingIssuanceSubject;
  }

  disconnect() {}
}

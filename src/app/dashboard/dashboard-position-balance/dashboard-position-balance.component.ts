import {DataSource} from '@angular/cdk/table';
import {Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject, Subscription} from 'rxjs';
import {NutsPlatformService} from 'src/app/common/web3/nuts-platform.service';

interface Position {
  instrument: string,
  issuanceId: number,
  creationTimestamp: number,
  role: string,
  state: string,
  token: string,
  amount: number,
  action: string
}

@Component({
  selector: 'app-dashboard-position-balance',
  templateUrl: './dashboard-position-balance.component.html',
  styleUrls: ['./dashboard-position-balance.component.scss']
})
export class DashboardPositionBalanceComponent implements OnInit, OnDestroy {
  private activePositions: Position[] = [];
  private lendingIssuanceSubscription: Subscription;
  private currentAccountSubscription: Subscription;
  private positionDataSource: PositionDataSource;

  constructor(private nutsPlatformService: NutsPlatformService, private zone: NgZone) {}

  ngOnInit() {
    this.positionDataSource = new PositionDataSource(this.nutsPlatformService);
    this.updatePositions();
    this.lendingIssuanceSubscription = this.nutsPlatformService.lendingIssuancesUpdatedSubject.subscribe(_ => {
      this.updatePositions();
    });
    this.currentAccountSubscription = this.nutsPlatformService.currentAccountSubject.subscribe(_ => {
      this.updatePositions();
    });
  }

  ngOnDestroy() {
    this.lendingIssuanceSubscription.unsubscribe();
    this.currentAccountSubscription.unsubscribe();
  }

  private updatePositions() {
    this.zone.run(() => {
      const positions = [];
      this.nutsPlatformService.lendingIssuances.forEach(issuance => {
        // If the current user is maker and the issuance is engageable.
        if (issuance.makerAddress === this.nutsPlatformService.currentAccount
          && issuance.state === 2) {
          positions.push({
            instrument: 'lending',
            issuanceId: issuance.issuanceId,
            creationTimestamp: issuance.creationTimestamp,
            role: 'maker',
            state: issuance.getIssuanceState(),
            token: this.nutsPlatformService.getTokenNameByAddress(issuance.lendingTokenAddress),
            amount: this.nutsPlatformService.getTokenValueByAddress(issuance.lendingTokenAddress, issuance.lendingAmount),
            action: 'close'
          });
        }

        // If the current user is taker and the issuance is engaged.
        if (issuance.takerAddress === this.nutsPlatformService.currentAccount
          && issuance.state == 3) {
          positions.push({
            instrument: 'lending',
            issuanceId: issuance.issuanceId,
            creationTimestamp: issuance.creationTimestamp,
            role: 'taker',
            state: issuance.getIssuanceState(),
            token: this.nutsPlatformService.getTokenNameByAddress(issuance.lendingTokenAddress),
            amount: this.nutsPlatformService.getTokenValueByAddress(issuance.lendingTokenAddress, issuance.lendingAmount + issuance.interestAmount),
            action: 'repay'
          });
        }
      });

      this.activePositions = positions;
      this.positionDataSource.setData(positions);
    });
  }
}

class PositionDataSource implements DataSource<Position> {

  constructor(private nutsPlatformService: NutsPlatformService) {}

  private positionSubject = new BehaviorSubject<Position[]>([]);

  setData(positions: Position[]) {
    this.positionSubject.next(positions);
  }

  connect() {
    return this.positionSubject;
  }

  disconnect() {}
}

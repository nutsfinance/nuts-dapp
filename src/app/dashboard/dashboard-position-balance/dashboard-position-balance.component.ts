import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataSource } from '@angular/cdk/table';
import { BehaviorSubject, Subscription } from 'rxjs';
import { LendingIssuanceModel } from 'src/app/common/model/lending-issuance.model';
import { NutsPlatformService } from 'src/app/common/web3/nuts-platform.service';

interface Position {
  instrument: string,
  id: number,
  creationTimestamp: number,
  role: string,
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
  private lendingIssuanceSubscription: Subscription;
  private currentAccountSubscription: Subscription;

  constructor(private nutsPlatformService: NutsPlatformService) { }

  ngOnInit() {
  }

  ngOnDestroy() {

  }
}

class LendingIssuanceDataSource implements DataSource<Position> {

  private positionSubject = new BehaviorSubject<Position[]>([]);

  setData(lendingIssuances: LendingIssuanceModel[]) {
    const positions = [];
    lendingIssuances.forEach(issuance => {
      
    });

    positions.push(lendingIssuances.map((issuance) => {
      return {
        instrument: 'lending',
        id: issuance.issuanceId,
        creationTimestamp: issuance.creationTimestamp,
        role: string,
        token: string,
        amount: number,
        action: string
      };
    }));

    this.positionSubject.next(positions);
  }

  connect() {
    return this.positionSubject;
  }

  disconnect() { }
}
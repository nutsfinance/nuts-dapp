import { DataSource } from '@angular/cdk/table';
import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { NutsPlatformService, USD_ADDRESS, CNY_ADDRESS } from 'src/app/common/web3/nuts-platform.service';
import { PriceOracleService } from 'src/app/common/web3/price-oracle.service';
import { CurrencyService } from 'src/app/common/currency-select/currency.service';
import { SupplementalLineItemModel, SupplementalLineItemType, SupplementalLineItemState } from 'src/app/common/model/supplemental-line-item.model';
import { InstrumentService } from 'src/app/common/web3/instrument.service';

interface Position {
  instrument: string,
  issuanceId: number,
  creationTimestamp: number,
  role: string,
  state: string,
  token: string,
  amount: number,
  action: string,
  supplementalLineItems: SupplementalLineItemModel[]
}

@Component({
  selector: 'app-dashboard-position-balance',
  templateUrl: './dashboard-position-balance.component.html',
  styleUrls: ['./dashboard-position-balance.component.scss']
})
export class DashboardPositionBalanceComponent implements OnInit, OnDestroy {
  private activePositions: Position[] = [];
  private convertedPayable: Promise<number>;
  private convertedReceivable: Promise<number>;

  private lendingIssuanceSubscription: Subscription;
  private currentAccountSubscription: Subscription;
  private currencySubscription: Subscription;
  private positionDataSource: PositionDataSource;

  constructor(private nutsPlatformService: NutsPlatformService, private instrumentService: InstrumentService,
    private priceOracleService: PriceOracleService, private currencyService: CurrencyService, private zone: NgZone) { }

  ngOnInit() {
    this.positionDataSource = new PositionDataSource(this.nutsPlatformService);
    this.updatePositions();
    this.lendingIssuanceSubscription = this.instrumentService.lendingIssuancesUpdatedSubject.subscribe(_ => {
      this.updatePositions();
    });
    this.currentAccountSubscription = this.nutsPlatformService.currentAccountSubject.subscribe(_ => {
      this.updatePositions();
    });
    this.currencySubscription = this.currencyService.currencyUpdatedSubject.subscribe(_ => {
      this.convertedPayable = this.getTotalPayable();
      this.convertedReceivable = this.getTotalReceivable();
    });
  }

  ngOnDestroy() {
    this.lendingIssuanceSubscription.unsubscribe();
    this.currentAccountSubscription.unsubscribe();
    this.currencySubscription.unsubscribe();
  }

  private updatePositions() {
    this.zone.run(() => {
      const positions = [];
      this.instrumentService.lendingIssuances.forEach(issuance => {
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
            action: 'close',
            supplementalLineItems: issuance.supplementalLineItems,
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
            amount: this.nutsPlatformService.getTokenValueByAddress(issuance.lendingTokenAddress, issuance.lendingAmount),
            action: 'repay',
            supplementalLineItems: issuance.supplementalLineItems,
          });
        }
      });

      this.activePositions = positions;
      this.positionDataSource.setData(positions);
      this.convertedPayable = this.getTotalPayable();
      this.convertedReceivable = this.getTotalReceivable();
    });
  }

  private async getTotalPayable() {
    let totalPayable = 0;
    const targetTokenAddress = this.currencyService.currency === 'USD' ? USD_ADDRESS : CNY_ADDRESS;
    for (let position of this.activePositions) {
      if (!position.supplementalLineItems) continue;
      for (let item of position.supplementalLineItems) {
        if (item.type !== SupplementalLineItemType.Payable
          || item.state !== SupplementalLineItemState.Unpaid
          || item.obligatorAddress !== this.nutsPlatformService.currentAccount) continue;

        const amount = this.nutsPlatformService.getTokenValueByAddress(item.tokenAddress, item.amount);
        totalPayable += await this.priceOracleService.getConvertedValue(targetTokenAddress, item.tokenAddress, amount);
      }
    }

    return totalPayable;
  }

  private async getTotalReceivable() {
    let totalReceivable = 0;
    const targetTokenAddress = this.currencyService.currency === 'USD' ? USD_ADDRESS : CNY_ADDRESS;
    for (let position of this.activePositions) {
      if (!position.supplementalLineItems) continue;
      for (let item of position.supplementalLineItems) {
        if (item.type !== SupplementalLineItemType.Payable
          || item.state !== SupplementalLineItemState.Unpaid
          || item.claimorAddress !== this.nutsPlatformService.currentAccount) continue;

        const amount = this.nutsPlatformService.getTokenValueByAddress(item.tokenAddress, item.amount);
        totalReceivable += await this.priceOracleService.getConvertedValue(targetTokenAddress, item.tokenAddress, amount);
      }
    }

    return totalReceivable;
  }
}

class PositionDataSource implements DataSource<Position> {

  constructor(private nutsPlatformService: NutsPlatformService) { }

  private positionSubject = new BehaviorSubject<Position[]>([]);

  setData(positions: Position[]) {
    this.positionSubject.next(positions);
  }

  connect() {
    return this.positionSubject;
  }

  disconnect() { }
}

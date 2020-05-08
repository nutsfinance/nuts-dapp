import { DataSource } from '@angular/cdk/table';
import { Component, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { NutsPlatformService, USD_ADDRESS, CNY_ADDRESS } from 'src/app/common/web3/nuts-platform.service';
import { PriceOracleService } from 'src/app/common/web3/price-oracle.service';
import { CurrencyService } from 'src/app/common/currency-select/currency.service';
import { SupplementalLineItemModel, SupplementalLineItemType, SupplementalLineItemState } from 'src/app/common/model/supplemental-line-item.model';
import { InstrumentService } from 'src/app/common/web3/instrument.service';
import { MatPaginator, MatTableDataSource } from '@angular/material';
import { LanguageService } from '../../../common/web3/language.service';

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
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  public activePositions: Position[] = [];
  public dataSource = new MatTableDataSource<Position>([]);

  public convertedPayable: Promise<number>;
  public convertedReceivable: Promise<number>;
  public positionDataSource: PositionDataSource;

  private lendingIssuanceSubscription: Subscription;
  private borrowingIssuanceSubscription: Subscription;
  private swapIssuanceSubscription: Subscription;
  private currentAccountSubscription: Subscription;
  private currencySubscription: Subscription;

  constructor(private nutsPlatformService: NutsPlatformService, private instrumentService: InstrumentService,
    private priceOracleService: PriceOracleService, public currencyService: CurrencyService,
    private languageService: LanguageService, private zone: NgZone) { }

  ngOnInit() {
    this.updatePositions();
    this.lendingIssuanceSubscription = this.instrumentService.lendingIssuancesUpdatedSubject.subscribe(_ => {
      this.updatePositions();
    });
    this.borrowingIssuanceSubscription = this.instrumentService.borrowingIssuancesUpdatedSubject.subscribe(_ => {
      this.updatePositions();
    });
    this.swapIssuanceSubscription = this.instrumentService.swapIssuancesUpdatedSubject.subscribe(_ => {
      this.updatePositions();
    })
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
    this.borrowingIssuanceSubscription.unsubscribe();
    this.swapIssuanceSubscription.unsubscribe();
    this.currentAccountSubscription.unsubscribe();
    this.currencySubscription.unsubscribe();
  }

  private updatePositions() {
    this.zone.run(() => {
      const positions = [];
      this.instrumentService.lendingIssuances.forEach(issuance => {
        // If the current user is maker and the issuance is engageable.
        if (issuance.makerAddress.toLowerCase() === this.nutsPlatformService.currentAccount.toLowerCase()
          && issuance.state === 2) {
          positions.push({
            instrument: 'lending',
            issuanceId: issuance.issuanceId,
            creationTimestamp: issuance.creationTimestamp,
            role: 'maker',
            state: issuance.getIssuanceState(),
            token: this.nutsPlatformService.getTokenNameByAddress(issuance.lendingTokenAddress),
            amount: issuance.lendingAmount,
            action: 'close',
            supplementalLineItems: issuance.supplementalLineItems,
          });
        }

        // If the current user is taker and the issuance is engaged.
        if (issuance.takerAddress.toLowerCase() === this.nutsPlatformService.currentAccount.toLowerCase()
          && issuance.state == 3) {
          positions.push({
            instrument: 'lending',
            issuanceId: issuance.issuanceId,
            creationTimestamp: issuance.creationTimestamp,
            role: 'taker',
            state: issuance.getIssuanceState(),
            token: this.nutsPlatformService.getTokenNameByAddress(issuance.lendingTokenAddress),
            amount: issuance.lendingAmount,
            action: 'repay',
            supplementalLineItems: issuance.supplementalLineItems,
          });
        }
      });

      this.instrumentService.borrowingIssuances.forEach(issuance => {
        // If the current user is maker and the issuance is engageable.
        if (issuance.makerAddress.toLowerCase() === this.nutsPlatformService.currentAccount.toLowerCase()
          && issuance.state === 2) {
          positions.push({
            instrument: 'borrowing',
            issuanceId: issuance.issuanceId,
            creationTimestamp: issuance.creationTimestamp,
            role: 'maker',
            state: issuance.getIssuanceState(),
            token: this.nutsPlatformService.getTokenNameByAddress(issuance.borrowingTokenAddress),
            amount: issuance.borrowingAmount,
            action: 'close',
            supplementalLineItems: issuance.supplementalLineItems,
          });
        }

        // If the current user is taker and the issuance is engaged.
        if (issuance.takerAddress.toLowerCase() === this.nutsPlatformService.currentAccount.toLowerCase()
          && issuance.state == 3) {
          positions.push({
            instrument: 'lending',
            issuanceId: issuance.issuanceId,
            creationTimestamp: issuance.creationTimestamp,
            role: 'taker',
            state: issuance.getIssuanceState(),
            token: this.nutsPlatformService.getTokenNameByAddress(issuance.borrowingTokenAddress),
            amount: issuance.borrowingAmount,
            action: 'repay',
            supplementalLineItems: issuance.supplementalLineItems,
          });
        }
      });

      this.instrumentService.swapIssuances.forEach(issuance => {
        // If the current user is maker and the issuance is engageable.
        if (issuance.makerAddress.toLowerCase() === this.nutsPlatformService.currentAccount.toLowerCase()
          && issuance.state === 2) {
          positions.push({
            instrument: 'swap',
            issuanceId: issuance.issuanceId,
            creationTimestamp: issuance.creationTimestamp,
            role: 'maker',
            state: issuance.getIssuanceState(),
            token: this.nutsPlatformService.getTokenNameByAddress(issuance.inputTokenAddress),
            amount: issuance.inputAmount,
            action: 'close',
            supplementalLineItems: issuance.supplementalLineItems,
          });
        }
      });

      this.activePositions = positions;
      this.dataSource = new MatTableDataSource<Position>(this.activePositions);
      this.dataSource.paginator = this.paginator;
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
          || item.obligatorAddress.toLowerCase() !== this.nutsPlatformService.currentAccount.toLowerCase()) continue;
        totalPayable += await this.priceOracleService.getConvertedValue(targetTokenAddress, item.tokenAddress, item.amount);
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
          || item.claimorAddress.toLowerCase() !== this.nutsPlatformService.currentAccount.toLowerCase()) continue;
        totalReceivable += await this.priceOracleService.getConvertedValue(targetTokenAddress, item.tokenAddress, item.amount);
      }
    }

    return totalReceivable;
  }
}

class PositionDataSource implements DataSource<Position> {

  private positionSubject = new BehaviorSubject<Position[]>([]);

  setData(positions: Position[]) {
    this.positionSubject.next(positions);
  }

  connect() {
    return this.positionSubject;
  }

  disconnect() { }
}

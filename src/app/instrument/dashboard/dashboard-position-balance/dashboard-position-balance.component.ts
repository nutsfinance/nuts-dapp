import { DataSource } from '@angular/cdk/table';
import { Component, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';

import { environment } from 'src/environments/environment';
import { NutsPlatformService, USD_ADDRESS, CNY_ADDRESS, LENDING_NAME, BORROWING_NAME, SWAP_NAME } from 'src/app/common/web3/nuts-platform.service';
import { PriceOracleService } from 'src/app/common/web3/price-oracle.service';
import { CurrencyService } from 'src/app/common/currency-select/currency.service';
import { MatPaginator, MatTableDataSource } from '@angular/material';
import { LendingService } from '../../lending/lending.service';
import { BorrowingService } from '../../borrowing/borrowing.service';
import { SwapService } from '../../swap/swap.service';
import { UserRole, IssuanceState, EngagementState, PayableModel, OfferState } from '../../issuance.model';
import { TokenService } from 'src/app/common/token/token.service';
import { LendingIssuanceModel } from '../../lending/lending-issuance.model';
import { BorrowingIssuanceModel } from '../../borrowing/borrowing-issuance.model';
import { SwapIssuanceModel } from '../../swap/swap-issuance.model';

interface Position {
  instrument: string,
  issuanceId: number,
  creationTimestamp: number,
  role: string,
  state: OfferState,
  token: string,
  amount: number,
  action: string,
  payables: PayableModel[]
}

@Component({
  selector: 'app-dashboard-position-balance',
  templateUrl: './dashboard-position-balance.component.html',
  styleUrls: ['./dashboard-position-balance.component.scss']
})
export class DashboardPositionBalanceComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  public language = environment.language;
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

  constructor(private nutsPlatformService: NutsPlatformService, private tokenService: TokenService, 
    private lendingService: LendingService, private borrowingService: BorrowingService,
    private swapService: SwapService, private priceOracleService: PriceOracleService,
    public currencyService: CurrencyService, private zone: NgZone) { }

  ngOnInit() {
    this.updatePositions();
    this.lendingIssuanceSubscription = this.lendingService.lendingIssuancesUpdated.subscribe(_ => {
      this.updatePositions();
    });
    this.borrowingIssuanceSubscription = this.borrowingService.borrowingIssuancesUpdated.subscribe(_ => {
      this.updatePositions();
    });
    this.swapIssuanceSubscription = this.swapService.swapIssuancesUpdated.subscribe(_ => {
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
    if (this.tokenService.tokens.length === 0)  return;
    this.zone.run(() => {
      const positions = [];
      this.lendingService.lendingIssuances.forEach(issuance => {
        // If the current user is maker and the issuance is engageable.
        const userRole = this.lendingService.getUserRole(issuance);
        const offerState = this.lendingService.getOfferState(issuance);
        const lendingIssuance = issuance.issuancecustomproperty as LendingIssuanceModel;
        if (userRole === UserRole.Maker && offerState === OfferState.Engageable) {
          positions.push({
            instrument: LENDING_NAME,
            issuanceId: issuance.issuanceid,
            creationTimestamp: issuance.issuancecreationtimestamp,
            role: userRole,
            state: offerState,
            token: this.tokenService.getTokenByAddress(lendingIssuance.lendingtokenaddress),
            amount: lendingIssuance.lendingamount,
            action: 'close',
            payables: issuance.payables,
          });
        }

        // If the current user is taker and the issuance is engaged.
        if (userRole === UserRole.Taker && offerState === OfferState.Engaged) {
          positions.push({
            instrument: LENDING_NAME,
            issuanceId: issuance.issuanceid,
            creationTimestamp: issuance.issuancecreationtimestamp,
            role: userRole,
            state: offerState,
            token: this.tokenService.getTokenByAddress(lendingIssuance.lendingtokenaddress),
            amount: lendingIssuance.lendingamount,
            action: 'repay',
            payables: issuance.payables,
          });
        }
      });

      this.borrowingService.borrowingIssuances.forEach(issuance => {
        const userRole = this.borrowingService.getUserRole(issuance);
        const offerState = this.borrowingService.getOfferState(issuance);
        const borrowingIssuance = issuance.issuancecustomproperty as BorrowingIssuanceModel;
        // If the current user is the maker and the issuance is engageable
        if (userRole === UserRole.Maker && offerState === OfferState.Engageable) {
          positions.push({
            instrument: BORROWING_NAME,
            issuanceId: issuance.issuanceid,
            creationTimestamp: issuance.issuancecreationtimestamp,
            role: userRole,
            state: offerState,
            token: this.tokenService.getTokenByAddress(borrowingIssuance.borrowingtokenaddress),
            amount: borrowingIssuance.borrowingamount,
            action: 'close',
            payables: issuance.payables,
          });
        }

        // If the current user is maker and the issuance is engaged.
        if (userRole === UserRole.Maker && offerState === OfferState.Engaged) {
          positions.push({
            instrument: BORROWING_NAME,
            issuanceId: issuance.issuanceid,
            creationTimestamp: issuance.issuancecreationtimestamp,
            role: userRole,
            state: offerState,
            token: this.tokenService.getTokenByAddress(borrowingIssuance.borrowingtokenaddress),
            amount: borrowingIssuance.borrowingamount,
            action: 'repay',
            payables: issuance.payables,
          });
        }
      });

      this.swapService.swapIssuances.forEach(issuance => {
        const userRole = this.swapService.getUserRole(issuance);
        const offerState = this.swapService.getOfferState(issuance);
        const swapIssuance = issuance.issuancecustomproperty as SwapIssuanceModel;
        // If the current user is maker and the issuance is engageable.
        if (userRole === UserRole.Maker && offerState === OfferState.Engageable) {
          positions.push({
            instrument: SWAP_NAME,
            issuanceId: issuance.issuanceid,
            creationTimestamp: issuance.issuancecreationtimestamp,
            role: userRole,
            state: offerState,
            token: this.tokenService.getTokenByAddress(swapIssuance.inputtokenaddress),
            amount: swapIssuance.inputamount,
            action: 'close',
            payables: issuance.payables,
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
    if (!this.nutsPlatformService.currentAccount) return 0;

    let totalPayable = 0;
    const currentAccount = this.nutsPlatformService.currentAccount.toLowerCase();
    for (let position of this.activePositions) {
      if (!position.payables) continue;
      for (let payable of position.payables) {
        if (payable.obligatoraddress.toLowerCase() !== currentAccount) continue;
        const payableToken = this.tokenService.getTokenByAddress(payable.tokenaddress);
        totalPayable += await this.priceOracleService.getConvertedCurrencyValue(payableToken, payable.amount);
      }
    }

    return totalPayable;
  }

  private async getTotalReceivable() {
    if (!this.nutsPlatformService.currentAccount) return 0;
    
    let totalReceivable = 0;
    const currentAccount = this.nutsPlatformService.currentAccount.toLowerCase();
    for (let position of this.activePositions) {
      if (!position.payables) continue;
      for (let payable of position.payables) {
        if (payable.claimoraddress.toLowerCase() !== currentAccount) continue;
        const payableToken = this.tokenService.getTokenByAddress(payable.tokenaddress);
        totalReceivable += await this.priceOracleService.getConvertedCurrencyValue(payableToken, payable.amount);
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

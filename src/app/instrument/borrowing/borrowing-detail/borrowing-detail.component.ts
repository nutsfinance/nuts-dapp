import { Location } from '@angular/common';
import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { NutsPlatformService, BORROWING_NAME } from 'src/app/common/web3/nuts-platform.service';
import { PriceOracleService } from 'src/app/common/web3/price-oracle.service';
import { CurrencyService } from 'src/app/common/currency-select/currency.service';
import { MatDialog } from '@angular/material';
import { TransactionInitiatedDialog } from 'src/app/common/transaction-initiated-dialog/transaction-initiated-dialog.component';
import { IssuanceModel, UserRole, IssuanceState, EngagementState, OfferState } from '../../issuance.model';
import { BorrowingIssuanceModel } from '../borrowing-issuance.model';
import { TokenModel } from 'src/app/common/token/token.model';
import { BorrowingService } from '../borrowing.service';
import { TokenService } from 'src/app/common/token/token.service';

@Component({
  selector: 'app-borrowing-detail',
  templateUrl: './borrowing-detail.component.html',
  styleUrls: ['./borrowing-detail.component.scss']
})
export class BorrowingDetailComponent implements OnInit, OnDestroy {
  public issuance: IssuanceModel;
  public borrowingIssuance: BorrowingIssuanceModel;
  public userRole: UserRole;
  public offerState: OfferState;

  public borrowingToken: TokenModel;
  public collateralToken: TokenModel;
  public borrowingTokenBalance = '0';
  public collateralValue = '0';
  public principalSufficient = true;

  public convertedCollateralValue: Promise<number>;
  public convertedBorrowingValue: Promise<number>;
  public convertedPerDayInterestValue: Promise<number>;
  public convertedTotalInterestValue: Promise<number>;

  private accountUpdatedSubscription: Subscription;
  private issuanceIdSubscription: Subscription;
  private borrowingUpdatedSubscription: Subscription;
  private currencyUpdatedSubscription: Subscription;

  constructor(public nutsPlatformService: NutsPlatformService, private borrowingService: BorrowingService,
    private priceOracleService: PriceOracleService, public currencyService: CurrencyService,
    private tokenService: TokenService, private route: ActivatedRoute, private zone: NgZone,
    private location: Location, private dialog: MatDialog) { }

  ngOnInit() {
    this.updateBorrowingIssuance(this.route.snapshot.params['id']);
    this.issuanceIdSubscription = this.route.params.subscribe((params) => {
      this.updateBorrowingIssuance(+params['id']);
    });
    this.accountUpdatedSubscription = this.nutsPlatformService.currentAccountSubject.subscribe(account => {
      this.updateBorrowingIssuance(this.issuance.issuanceid);
    });
    this.borrowingUpdatedSubscription = this.borrowingService.borrowingIssuancesUpdated.subscribe(_ => {
      this.updateBorrowingIssuance(this.issuance.issuanceid);
    });
    this.currencyUpdatedSubscription = this.currencyService.currencyUpdatedSubject.subscribe(_ => {
      this.updateConvertedValue();
    });
  }

  ngOnDestroy() {
    this.accountUpdatedSubscription.unsubscribe();
    this.issuanceIdSubscription.unsubscribe();
    this.borrowingUpdatedSubscription.unsubscribe();
    this.currencyUpdatedSubscription.unsubscribe();
  }

  navigateBack() {
    this.location.back();
  }

  onPrincipalTokenBalanceUpdated(balance) {
    this.borrowingTokenBalance = balance;
    // We only need to check two cases:
    // 1. Current user is the maker, and the current user is going to repay
    // 2. Current user is the taker, and the current user is going to engage
    let targetAmount = '0';
    const BN = this.nutsPlatformService.web3.utils.BN;
    const userRole = this.borrowingService.getUserRole(this.issuance);
    if (userRole === UserRole.Maker && this.issuance.engagements.length > 0
      && this.issuance.engagements[0].engagementstate === EngagementState.Active) {
      targetAmount = new BN(this.borrowingIssuance.borrowingamount).add(new BN(this.borrowingIssuance.interestamount)).toString();
    } else if (userRole === UserRole.Taker && this.issuance.issuancestate === IssuanceState.Engageable) {
      targetAmount = this.borrowingIssuance.borrowingamount;
    }

    setTimeout(() => {
      this.principalSufficient = new BN(this.borrowingTokenBalance).gte(new BN(targetAmount));
    });
  }

  engageIssuance() {
    if (!this.principalSufficient) return;
    this.borrowingService.engageBorrowingIssuance(this.issuance.issuanceid)
      .on('transactionHash', transactionHash => {
        this.zone.run(() => {
          // Opens Engagement Initiated dialog.
          const transactionInitiatedDialog = this.dialog.open(TransactionInitiatedDialog, {
            width: '90%',
            data: {
              type: 'engage_issuance', instrument: BORROWING_NAME, issuanceId: this.issuance.issuanceid,
              tokenAmount: this.borrowingIssuance.borrowingamount,
              tokenName: this.borrowingToken.tokenSymbol,
            },
          });
          transactionInitiatedDialog.afterClosed().subscribe(() => {
            this.location.back();
          });
        });
      });
  }

  repayIssuance() {
    if (!this.principalSufficient) return;
    const BN = this.nutsPlatformService.web3.utils.BN;
    const totalAmount = new BN(this.borrowingIssuance.borrowingamount).add(new BN(this.borrowingIssuance.interestamount)).toString();
    
    this.borrowingService.repayBorrowingIssuance(this.issuance.issuanceid, this.borrowingToken, totalAmount)
      .on('transactionHash', transactionHash => {
        this.zone.run(() => {
          // Opens Engagement Initiated dialog.
          const transactionInitiatedDialog = this.dialog.open(TransactionInitiatedDialog, {
            width: '90%',
            data: {
              type: 'repay_issuance', instrument: BORROWING_NAME, issuanceId: this.issuance.issuanceid,
              tokenAmount: totalAmount, tokenName: this.borrowingToken.tokenSymbol,
            },
          });
          transactionInitiatedDialog.afterClosed().subscribe(() => {
            this.location.back();
          });
        });
      });
  }

  cancelIssuance() {
    this.borrowingService.cancelBorrowingIssuance(this.issuance.issuanceid)
      .on('transactionHash', transactionHash => {
        this.zone.run(() => {
          // Opens Cancel Initiated dialog.
          const transactionInitiatedDialog = this.dialog.open(TransactionInitiatedDialog, {
            width: '90%',
            data: {
              type: 'cancel_issuance', instrument: BORROWING_NAME, issuanceId: this.issuance.issuanceid,
            },
          });
          transactionInitiatedDialog.afterClosed().subscribe(() => {
            this.location.back();
          });
        });
      });
  }

  private updateBorrowingIssuance(issuanceId) {
    this.zone.run(() => {
      this.issuance = this.borrowingService.getBorrowingIssuance(issuanceId);
      if (this.issuance) {
        this.borrowingIssuance = this.issuance.issuancecustomproperty as BorrowingIssuanceModel;
        this.userRole = this.borrowingService.getUserRole(this.issuance);
        this.offerState = this.borrowingService.getOfferState(this.issuance);
        // Compute issuance token values
        this.borrowingToken = this.tokenService.getTokenByAddress(this.borrowingIssuance.borrowingtokenaddress);
        this.collateralToken = this.tokenService.getTokenByAddress(this.borrowingIssuance.collateraltokenaddress);
        // If the collateral value is not set
        if (!this.borrowingIssuance.collateralamount || this.borrowingIssuance.collateralamount === '0') {
          this.borrowingService.getBorrowingCollateralValue(this.borrowingIssuance).then(value => {
            this.collateralValue = value;
            this.convertedCollateralValue = this.priceOracleService.getConvertedCurrencyValue(this.collateralToken, value);
          });
        } else {
          this.collateralValue = this.borrowingIssuance.collateralamount;
        }
        this.updateConvertedValue();
      }
    });
  }

  private updateConvertedValue() {
    // Compute converted issuance token values
    this.convertedCollateralValue = this.priceOracleService.getConvertedCurrencyValue(this.collateralToken, this.collateralValue);
    this.convertedBorrowingValue = this.priceOracleService.getConvertedCurrencyValue(this.borrowingToken, this.borrowingIssuance.borrowingamount);
    this.convertedPerDayInterestValue = this.priceOracleService.getConvertedCurrencyValue(this.borrowingToken,
      this.borrowingService.getPerDayInterest(this.borrowingIssuance));
    this.convertedTotalInterestValue = this.priceOracleService.getConvertedCurrencyValue(this.borrowingToken,
      this.borrowingIssuance.interestamount);
  }
}

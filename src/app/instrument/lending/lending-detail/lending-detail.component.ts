import { Location } from '@angular/common';
import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { NutsPlatformService, USD_ADDRESS, CNY_ADDRESS, LENDING_NAME } from 'src/app/common/web3/nuts-platform.service';
import { PriceOracleService } from 'src/app/common/web3/price-oracle.service';
import { CurrencyService } from 'src/app/common/currency-select/currency.service';
import { MatDialog } from '@angular/material';
import { TransactionInitiatedDialog } from 'src/app/common/transaction-initiated-dialog/transaction-initiated-dialog.component';
import { TokenModel } from 'src/app/common/token/token.model';
import { IssuanceModel } from '../../issuance.model';
import { LendingIssuanceModel } from '../lending-issuance.model';
import { LendingService } from '../lending.service';
import { AccountService } from 'src/app/account/account.service';
import { TokenService } from 'src/app/common/token/token.service';

@Component({
  selector: 'app-lending-detail',
  templateUrl: './lending-detail.component.html',
  styleUrls: ['./lending-detail.component.scss']
})
export class LendingDetailComponent implements OnInit, OnDestroy {
  public issuance: IssuanceModel;
  public lendingIssuance: LendingIssuanceModel;
  public lendingToken: TokenModel;
  public collateralToken: TokenModel;
  public lendingTokenBalance = '0';
  public collateralTokenBalance = '0';
  public collateralValue = '0';
  public principalSufficient = true;
  public collateralSufficient = true;

  public convertedCollateralValue: Promise<number>;
  public convertedLendingValue: Promise<number>;
  public convertedPerDayInterestValue: Promise<number>;
  public convertedTotalInterestValue: Promise<number>;

  private accountUpdatedSubscription: Subscription;
  private issuanceIdSubscription: Subscription;
  private lendingUpdatedSubscription: Subscription;
  private currencyUpdatedSubscription: Subscription;

  constructor(public nutsPlatformService: NutsPlatformService, private lendingService: LendingService,
    private priceOracleService: PriceOracleService, public currencyService: CurrencyService, private accountService: AccountService,
    private tokenService: TokenService, private route: ActivatedRoute, private zone: NgZone,
    private location: Location, private dialog: MatDialog) { }

  ngOnInit() {
    this.updateLendingIssuance(this.route.snapshot.params['id']);
    this.issuanceIdSubscription = this.route.params.subscribe((params) => {
      this.updateLendingIssuance(+params['id']);
    });
    this.accountUpdatedSubscription = this.nutsPlatformService.currentAccountSubject.subscribe(account => {
      this.updateLendingIssuance(this.issuance.issuanceid);
    });
    this.lendingUpdatedSubscription = this.lendingService.lendingIssuancesUpdated.subscribe(_ => {
      this.updateLendingIssuance(this.issuance.issuanceid);
    });
    this.currencyUpdatedSubscription = this.currencyService.currencyUpdatedSubject.subscribe(_ => {
      this.updateConvertedValue();
    });
  }

  ngOnDestroy() {
    this.accountUpdatedSubscription.unsubscribe();
    this.issuanceIdSubscription.unsubscribe();
    this.lendingUpdatedSubscription.unsubscribe();
    this.currencyUpdatedSubscription.unsubscribe();
  }

  navigateBack() {
    this.location.back();
  }

  onPrincipalTokenBalanceUpdated(balance) {
    this.lendingTokenBalance = balance;
    setTimeout(() => {
      const BN = this.nutsPlatformService.web3.utils.BN;
      const repayAmount = new BN(this.lendingIssuance.lendingamount).add(new BN(this.lendingIssuance.interestamount));
      this.principalSufficient = new BN(this.lendingTokenBalance).gte(repayAmount);
    });
  }

  onCollateralTokenBalanceUpdated(balance) {
    this.collateralTokenBalance = balance;
    setTimeout(() => {
      const BN = this.nutsPlatformService.web3.utils.BN;
      this.collateralSufficient = new BN(this.collateralTokenBalance).gte(new BN(this.collateralValue));
    });
  }

  engageIssuance() {
    if (!this.collateralSufficient) return;
    this.lendingService.engageLendingIssuance(this.issuance.issuanceid)
      .on('transactionHash', transactionHash => {
        this.zone.run(() => {
          // Opens Engagement Initiated dialog.
          const transactionInitiatedDialog = this.dialog.open(TransactionInitiatedDialog, {
            width: '90%',
            data: {
              type: 'engage_issuance', instrument: LENDING_NAME, issuanceId: this.issuance.issuanceid,
              tokenAmount: this.lendingIssuance.lendingamount, tokenName: this.lendingToken.tokenSymbol,
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
    const repayAmount = new BN(this.lendingIssuance.lendingamount).add(new BN(this.lendingIssuance.interestamount));

    this.lendingService.repayLendingIssuance(this.issuance.issuanceid, this.lendingToken, repayAmount)
      .on('transactionHash', transactionHash => {
        this.zone.run(() => {
          // Opens Engagement Initiated dialog.
          const transactionInitiatedDialog = this.dialog.open(TransactionInitiatedDialog, {
            width: '90%',
            data: {
              type: 'repay_issuance', instrument: LENDING_NAME, issuanceId: this.issuance.issuanceid,
              tokenAmount: repayAmount, tokenName: this.lendingToken.tokenSymbol,
            },
          });
          transactionInitiatedDialog.afterClosed().subscribe(() => {
            this.location.back();
          });
        });

      });
  }

  cancelIssuance() {
    this.lendingService.cancelLendingIssuance(this.issuance.issuanceid)
      .on('transactionHash', transactionHash => {
        this.zone.run(() => {
          // Opens Cancel Initiated dialog.
          const transactionInitiatedDialog = this.dialog.open(TransactionInitiatedDialog, {
            width: '90%',
            data: {
              type: 'cancel_issuance', instrument: LENDING_NAME, issuanceId: this.issuance.issuanceid,
            },
          });
          transactionInitiatedDialog.afterClosed().subscribe(() => {
            this.location.back();
          });
        });
      });
  }

  private updateLendingIssuance(issuanceId) {
    const BN = this.nutsPlatformService.web3.utils.BN;
    this.zone.run(() => {
      this.issuance = this.lendingService.getLendingIssuance(issuanceId);
      if (this.issuance) {
        this.lendingIssuance = this.issuance.issuancecustomproperty as LendingIssuanceModel;
        // Compute issuance token values
        this.lendingToken = this.tokenService.getTokenByAddress(this.lendingIssuance.lendingtokenaddress);
        this.collateralToken = this.tokenService.getTokenByAddress(this.lendingIssuance.collateraltokenaddress);
        // If the collateral value is not set
        if (this.lendingIssuance.collateralamount === '0') {
          this.lendingService.getCollateralValue(this.lendingIssuance).then(value => {
            this.collateralValue = value;
            this.collateralSufficient = new BN(this.collateralTokenBalance).gte(new BN(this.collateralValue));
          });
        } else {
          this.collateralValue = this.lendingIssuance.collateralamount;
          this.collateralSufficient = new BN(this.collateralTokenBalance).gte(new BN(this.collateralValue));
        }
        this.updateConvertedValue();
      }
    });
  }

  private updateConvertedValue() {
    // Compute converted issuance token values
    this.convertedCollateralValue = this.priceOracleService.getConvertedCurrencyValue(this.lendingToken, this.collateralValue);
    this.convertedLendingValue = this.priceOracleService.getConvertedCurrencyValue(this.lendingToken, this.lendingIssuance.lendingamount);
    this.convertedPerDayInterestValue = this.priceOracleService.getConvertedCurrencyValue(this.lendingToken,
      this.lendingService.getPerDayInterest(this.lendingIssuance));
    this.convertedTotalInterestValue = this.priceOracleService.getConvertedCurrencyValue(this.lendingToken,
      this.lendingIssuance.interestamount);
  }
}

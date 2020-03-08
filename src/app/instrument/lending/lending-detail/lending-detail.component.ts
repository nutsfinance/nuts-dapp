import { Location } from '@angular/common';
import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { LendingIssuanceModel } from 'src/app/common/model/lending-issuance.model';
import { NutsPlatformService, USD_ADDRESS, CNY_ADDRESS } from 'src/app/common/web3/nuts-platform.service';
import { PriceOracleService } from 'src/app/common/web3/price-oracle.service';
import { CurrencyService } from 'src/app/common/currency-select/currency.service';
import { InstrumentService, IssuanceTransaction } from 'src/app/common/web3/instrument.service';
import { MatDialog } from '@angular/material';
import { TransactionInitiatedDialog } from 'src/app/common/transaction-initiated-dialog/transaction-initiated-dialog.component';
import { NotificationModel } from 'src/app/notification/notification.model';
import { NotificationService } from 'src/app/notification/notification.service';

@Component({
  selector: 'app-lending-detail',
  templateUrl: './lending-detail.component.html',
  styleUrls: ['./lending-detail.component.scss']
})
export class LendingDetailComponent implements OnInit, OnDestroy {
  private issuanceId: number;
  private issuance: LendingIssuanceModel;
  private notifications: NotificationModel[] = [];
  private lendingToken: string;
  private lendingValue: number;
  private collateralToken: string;
  private lendingTokenBalance: number = -1;
  private collateralTokenBalance: number = -1;
  private collateralValue = 0;
  private perDayInterestValue;
  private totalInterestValue;
  private transactions: IssuanceTransaction[] = [];

  private convertedCollateralValue: Promise<number>;
  private convertedLendingValue: Promise<number>;
  private convertedPerDayInterestValue: Promise<number>;
  private convertedTotalInterestValue: Promise<number>;

  private accountUpdatedSubscription: Subscription;
  private issuanceIdSubscription: Subscription;
  private lendingUpdatedSubscription: Subscription;
  private currencyUpdatedSubscription: Subscription;

  constructor(private nutsPlatformService: NutsPlatformService, private instrumentService: InstrumentService,
    private notificationService: NotificationService, private priceOracleService: PriceOracleService,
    private currencyService: CurrencyService, private route: ActivatedRoute, private zone: NgZone,
    private location: Location, private dialog: MatDialog) { }

  ngOnInit() {
    this.issuanceId = this.route.snapshot.params['id'];
    this.updateLendingIssuance();
    this.issuanceIdSubscription = this.route.params.subscribe((params) => {
      this.issuanceId = +params['id'];
      this.updateLendingIssuance();
    });
    this.accountUpdatedSubscription = this.nutsPlatformService.currentAccountSubject.subscribe(_ => {
      this.updateLendingIssuance();
    });
    this.lendingUpdatedSubscription = this.instrumentService.lendingIssuancesUpdatedSubject.subscribe(_ => {
      this.updateLendingIssuance();
    });
    this.currencyUpdatedSubscription = this.currencyService.currencyUpdatedSubject.subscribe(_ => {
      this.updateLendingIssuance();
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

  engageIssuance() {
    if (this.collateralTokenBalance >= this.collateralValue) {
      this.instrumentService.engageIssuance('lending', this.issuanceId).on('transactionHash', transactionHash => {
        this.zone.run(() => {
          // Opens Engagement Initiated dialog.
          const transactionInitiatedDialog = this.dialog.open(TransactionInitiatedDialog, {
            width: '90%',
            data: {
              type: 'engage_issuance',
              issuanceId: this.issuance.issuanceId,
              principalAmount: this.nutsPlatformService.getTokenValueByAddress(this.issuance.lendingTokenAddress, this.issuance.lendingAmount),
              principalTokenName: this.nutsPlatformService.getTokenNameByAddress(this.issuance.lendingTokenAddress),
            },
          });
          transactionInitiatedDialog.afterClosed().subscribe(() => {
            this.location.back();
          });
        });
      });
    }
  }

  repayIssuance() {
    const totalAmount = this.lendingValue + this.totalInterestValue;
    console.log('Total amount: ' + totalAmount + ", balance: " + this.lendingTokenBalance);
    if (this.lendingTokenBalance >= totalAmount) {
      this.instrumentService.repayIssuance('lending', this.issuanceId, this.issuance.lendingTokenAddress, totalAmount).on('transactionHash', transactionHash => {
        this.zone.run(() => {
          // Opens Engagement Initiated dialog.
          const transactionInitiatedDialog = this.dialog.open(TransactionInitiatedDialog, {
            width: '90%',
            data: {
              type: 'repay_issuance',
              issuanceId: this.issuance.issuanceId,
              totalAmount: totalAmount,
              principalTokenName: this.nutsPlatformService.getTokenNameByAddress(this.issuance.lendingTokenAddress),
            },
          });
          transactionInitiatedDialog.afterClosed().subscribe(() => {
            this.location.back();
          });
        });
      });
    }
  }

  cancelIssuance() {
    this.instrumentService.cancelIssuance('lending', this.issuanceId).on('transactionHash', transactionHash => {
      this.zone.run(() => {
        // Opens Cancel Initiated dialog.
        const transactionInitiatedDialog = this.dialog.open(TransactionInitiatedDialog, {
          width: '90%',
          data: {
            type: 'cancel_issuance',
            issuanceId: this.issuance.issuanceId,
          },
        });
        transactionInitiatedDialog.afterClosed().subscribe(() => {
          this.location.back();
        });
      });
    });
  }

  private updateLendingIssuance() {
    this.zone.run(() => {
      this.issuance = this.instrumentService.getLendingIssuance(this.issuanceId);
      console.log(this.issuance);
      console.log(this.currencyService.currency);
      if (this.issuance) {
        console.log(this.issuance.makerAddress, this.nutsPlatformService.currentAccount);
        this.lendingToken = this.nutsPlatformService.getTokenNameByAddress(this.issuance.lendingTokenAddress);
        this.lendingValue = this.nutsPlatformService.getTokenValueByAddress(this.issuance.lendingTokenAddress, this.issuance.lendingAmount);
        this.collateralToken = this.nutsPlatformService.getTokenNameByAddress(this.issuance.collateralTokenAddress);
        this.perDayInterestValue = this.lendingValue * this.issuance.interestRate / 1000000;
        this.totalInterestValue = this.lendingValue * this.issuance.interestRate * this.issuance.tenorDays / 1000000;
        this.priceOracleService.getConvertedValue(this.issuance.collateralTokenAddress, this.issuance.lendingTokenAddress, this.lendingValue * this.issuance.collateralRatio, 10000).then(value => {
          this.collateralValue = value;
        });

        const targetTokenAddress = this.currencyService.currency === 'USD' ? USD_ADDRESS : CNY_ADDRESS;
        this.convertedCollateralValue = this.priceOracleService.getConvertedValue(targetTokenAddress,
          this.issuance.lendingTokenAddress, this.lendingValue * this.issuance.collateralRatio, 10000);
        this.convertedLendingValue = this.priceOracleService.getConvertedValue(targetTokenAddress, this.issuance.lendingTokenAddress, this.lendingValue);
        this.convertedPerDayInterestValue = this.priceOracleService.getConvertedValue(targetTokenAddress, this.issuance.lendingTokenAddress,
          this.lendingValue * this.issuance.interestRate, 1000000);
        this.convertedTotalInterestValue = this.priceOracleService.getConvertedValue(targetTokenAddress, this.issuance.lendingTokenAddress,
          this.lendingValue * this.issuance.interestRate * this.issuance.tenorDays, 1000000);

        this.instrumentService.getIssuanceTransactions('lending', this.issuance).then((transactions) => {
          console.log(transactions);
          this.transactions = transactions;
        });
      }

      const instrumentId = this.nutsPlatformService.getInstrumentId('lending');
      console.log(this.notificationService.notifications);
      this.notifications = this.notificationService.notifications.filter(notification => {
        return notification.instrumentId == instrumentId && notification.issuanceId == this.issuanceId;
      });
      console.log(this.notifications);
    });
  }
}

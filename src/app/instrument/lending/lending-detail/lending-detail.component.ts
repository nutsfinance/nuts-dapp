import { Location } from '@angular/common';
import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { LendingIssuanceModel } from 'src/app/common/model/lending-issuance.model';
import { NutsPlatformService, USD_ADDRESS, CNY_ADDRESS } from 'src/app/common/web3/nuts-platform.service';
import { PriceOracleService } from 'src/app/common/web3/price-oracle.service';
import { CurrencyService } from 'src/app/common/currency-select/currency.service';
import { InstrumentService, IssuanceTransfer } from 'src/app/common/web3/instrument.service';
import { MatDialog } from '@angular/material';
import { TransactionInitiatedDialog } from 'src/app/common/transaction-initiated-dialog/transaction-initiated-dialog.component';
import { AccountBalanceService } from 'src/app/common/web3/account-balance.service';

@Component({
  selector: 'app-lending-detail',
  templateUrl: './lending-detail.component.html',
  styleUrls: ['./lending-detail.component.scss']
})
export class LendingDetailComponent implements OnInit, OnDestroy {
  public issuanceId: number;
  public issuance: LendingIssuanceModel;
  public lendingToken: string;
  public collateralToken: string;
  public lendingTokenBalance = -1;
  public collateralTokenBalance = -1;
  public collateralValue = 0;
  public principalSufficient = true;
  public collateralSufficient = true;

  public convertedCollateralValue: Promise<number>;
  public convertedLendingValue: Promise<number>;
  public convertedPerDayInterestValue: Promise<number>;
  public convertedTotalInterestValue: Promise<number>;

  public columns: string[] = ['action', 'from', 'to', 'amount', 'date'];
  public transactions: IssuanceTransfer[] = [];

  private accountUpdatedSubscription: Subscription;
  private issuanceIdSubscription: Subscription;
  private lendingUpdatedSubscription: Subscription;
  private currencyUpdatedSubscription: Subscription;

  constructor(public nutsPlatformService: NutsPlatformService, private instrumentService: InstrumentService,
    private priceOracleService: PriceOracleService, public currencyService: CurrencyService, private accountBalanceService: AccountBalanceService,
    private route: ActivatedRoute, private zone: NgZone, private location: Location, private dialog: MatDialog) { }

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
      const repayAmount = this.issuance.lendingAmount + this.issuance.lendingAmount * this.issuance.interestRate * this.issuance.tenorDays / 1000000;
      this.principalSufficient = this.lendingTokenBalance >= repayAmount;
    });
  }

  onCollateralTokenBalanceUpdated(balance) {
    this.collateralTokenBalance = balance;
    setTimeout(() => {
      this.collateralSufficient = this.collateralTokenBalance >= this.collateralValue;
      console.log(this.collateralTokenBalance, this.collateralValue, this.collateralSufficient);
    });
  }

  engageIssuance() {
    if (this.collateralTokenBalance < this.collateralValue) return;
    this.instrumentService.engageIssuance('lending', this.issuanceId)
      .on('transactionHash', transactionHash => {
        this.zone.run(() => {
          // Opens Engagement Initiated dialog.
          const transactionInitiatedDialog = this.dialog.open(TransactionInitiatedDialog, {
            width: '90%',
            data: {
              type: 'engage_issuance',
              instrument: 'lending',
              issuanceId: this.issuance.issuanceId,
              tokenAmount: this.nutsPlatformService.getTokenValueByAddress(this.issuance.lendingTokenAddress, this.issuance.lendingAmount),
              tokenName: this.nutsPlatformService.getTokenNameByAddress(this.issuance.lendingTokenAddress),
            },
          });
          transactionInitiatedDialog.afterClosed().subscribe(() => {
            this.location.back();
          });
        });

        this.monitorLendingTransaction(transactionHash);
      });
  }

  repayIssuance() {
    const totalAmount = this.issuance.lendingAmount + this.issuance.lendingAmount * this.issuance.interestRate * this.issuance.tenorDays / 1000000;
    console.log('Total amount: ' + totalAmount + ", balance: " + this.lendingTokenBalance);
    if (this.lendingTokenBalance < totalAmount) return;
    this.instrumentService.repayIssuance('lending', this.issuanceId, this.issuance.lendingTokenAddress, totalAmount)
      .on('transactionHash', transactionHash => {
        this.zone.run(() => {
          // Opens Engagement Initiated dialog.
          const transactionInitiatedDialog = this.dialog.open(TransactionInitiatedDialog, {
            width: '90%',
            data: {
              type: 'repay_issuance',
              instrument: 'lending',
              issuanceId: this.issuance.issuanceId,
              tokenAmount: totalAmount,
              tokenName: this.nutsPlatformService.getTokenNameByAddress(this.issuance.lendingTokenAddress),
            },
          });
          transactionInitiatedDialog.afterClosed().subscribe(() => {
            this.location.back();
          });
        });

        this.monitorLendingTransaction(transactionHash);
      });
  }

  cancelIssuance() {
    this.instrumentService.cancelIssuance('lending', this.issuanceId)
      .on('transactionHash', transactionHash => {
        this.zone.run(() => {
          // Opens Cancel Initiated dialog.
          const transactionInitiatedDialog = this.dialog.open(TransactionInitiatedDialog, {
            width: '90%',
            data: {
              type: 'cancel_issuance',
              instrument: 'lending',
              issuanceId: this.issuance.issuanceId,
            },
          });
          transactionInitiatedDialog.afterClosed().subscribe(() => {
            this.location.back();
          });
        });

        this.monitorLendingTransaction(transactionHash);
      });
  }

  private monitorLendingTransaction(transactionHash) {
    // Monitoring transaction status(work around for Metamask mobile)
    const interval = setInterval(async () => {
      const receipt = await this.nutsPlatformService.web3.eth.getTransactionReceipt(transactionHash);
      if (!receipt || !receipt.blockNumber) return;

      console.log('Create receipt', receipt);
      // New lending issuance created. Need to refresh the lending issuance list.
      this.instrumentService.reloadLendingIssuances(5, 3000);
      // New lending issuance created. Need to update the principal balance as well.
      this.accountBalanceService.getUserBalanceFromBackend(5, 3000);
      this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
      clearInterval(interval);
    }, 2000);
  }

  private updateLendingIssuance() {
    this.zone.run(() => {
      this.issuance = this.instrumentService.getLendingIssuanceById(this.issuanceId);
      console.log('Issuance detail', this.issuance);
      if (this.issuance) {
        // Compute issuance token values
        this.lendingToken = this.nutsPlatformService.getTokenNameByAddress(this.issuance.lendingTokenAddress);
        this.collateralToken = this.nutsPlatformService.getTokenNameByAddress(this.issuance.collateralTokenAddress);
        // If the collateral value is not set
        if (this.issuance.collateralAmount == 0) {
          this.priceOracleService.getConvertedValue(this.issuance.collateralTokenAddress, this.issuance.lendingTokenAddress, this.issuance.lendingAmount * this.issuance.collateralRatio, 10000).then(value => {
            this.collateralValue = value;
            this.collateralSufficient = this.collateralTokenBalance === -1 || this.collateralTokenBalance >= this.collateralValue;
          });
        } else {
          this.collateralValue = this.issuance.collateralAmount;
          this.collateralSufficient = this.collateralTokenBalance === -1 || this.collateralTokenBalance >= this.collateralValue;
        }
        this.updateConvertedValue();
      }
    });
  }

  private updateConvertedValue() {
    // Compute converted issuance token values
    const targetTokenAddress = this.currencyService.currency === 'USD' ? USD_ADDRESS : CNY_ADDRESS;
    this.convertedCollateralValue = this.priceOracleService.getConvertedValue(targetTokenAddress,
      this.issuance.lendingTokenAddress, this.issuance.lendingAmount * this.issuance.collateralRatio, 10000);
    this.convertedLendingValue = this.priceOracleService.getConvertedValue(targetTokenAddress,
      this.issuance.lendingTokenAddress, this.issuance.lendingAmount);
    this.convertedPerDayInterestValue = this.priceOracleService.getConvertedValue(targetTokenAddress,
      this.issuance.lendingTokenAddress, this.issuance.lendingAmount * this.issuance.interestRate, 1000000);
    this.convertedTotalInterestValue = this.priceOracleService.getConvertedValue(targetTokenAddress,
      this.issuance.lendingTokenAddress, this.issuance.lendingAmount * this.issuance.interestRate * this.issuance.tenorDays, 1000000);
  }
}

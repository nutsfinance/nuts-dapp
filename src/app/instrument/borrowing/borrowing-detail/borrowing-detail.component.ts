import { Location } from '@angular/common';
import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { BorrowingIssuanceModel } from 'src/app/common/model/borrowing-issuance.model';
import { NutsPlatformService, USD_ADDRESS, CNY_ADDRESS } from 'src/app/common/web3/nuts-platform.service';
import { PriceOracleService } from 'src/app/common/web3/price-oracle.service';
import { CurrencyService } from 'src/app/common/currency-select/currency.service';
import { InstrumentService } from 'src/app/common/web3/instrument.service';
import { MatDialog } from '@angular/material';
import { TransactionInitiatedDialog } from 'src/app/common/transaction-initiated-dialog/transaction-initiated-dialog.component';
import { AccountBalanceService } from 'src/app/common/web3/account-balance.service';

@Component({
  selector: 'app-borrowing-detail',
  templateUrl: './borrowing-detail.component.html',
  styleUrls: ['./borrowing-detail.component.scss']
})
export class BorrowingDetailComponent implements OnInit {
  public issuanceId: number;
  public issuance: BorrowingIssuanceModel;
  public borrowingToken: string;
  public collateralToken: string;
  public borrowingTokenBalance = -1;
  public collateralTokenBalance = -1;
  public collateralValue = 0;
  public principalSufficient = true;
  public collateralSufficient = true;

  public convertedCollateralValue: Promise<number>;
  public convertedBorrowingValue: Promise<number>;
  public convertedPerDayInterestValue: Promise<number>;
  public convertedTotalInterestValue: Promise<number>;

  private accountUpdatedSubscription: Subscription;
  private issuanceIdSubscription: Subscription;
  private borrowingUpdatedSubscription: Subscription;
  private currencyUpdatedSubscription: Subscription;

  constructor(public nutsPlatformService: NutsPlatformService, private instrumentService: InstrumentService,
    private priceOracleService: PriceOracleService, public currencyService: CurrencyService, private accountBalanceService: AccountBalanceService,
    private route: ActivatedRoute, private zone: NgZone, private location: Location, private dialog: MatDialog) { }

  ngOnInit() {
    this.issuanceId = this.route.snapshot.params['id'];
    this.updateBorrowingIssuance();
    this.issuanceIdSubscription = this.route.params.subscribe((params) => {
      this.issuanceId = +params['id'];
      this.updateBorrowingIssuance();
    });
    this.accountUpdatedSubscription = this.nutsPlatformService.currentAccountSubject.subscribe(_ => {
      this.updateBorrowingIssuance();
    });
    this.borrowingUpdatedSubscription = this.instrumentService.borrowingIssuancesUpdatedSubject.subscribe(_ => {
      this.updateBorrowingIssuance();
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
    setTimeout(() => {
      const repayAmount = this.issuance.borrowingAmount + this.issuance.borrowingAmount * this.issuance.interestRate * this.issuance.tenorDays / 1000000;
      this.principalSufficient = this.borrowingTokenBalance >= repayAmount;
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
    this.instrumentService.engageIssuance('borrowing', this.issuanceId)
      .on('transactionHash', transactionHash => {
        this.zone.run(() => {
          // Opens Engagement Initiated dialog.
          const transactionInitiatedDialog = this.dialog.open(TransactionInitiatedDialog, {
            width: '90%',
            data: {
              type: 'engage_issuance',
              instrument: 'borrowing',
              issuanceId: this.issuance.issuanceId,
              tokenAmount: this.nutsPlatformService.getTokenValueByAddress(this.issuance.borrowingTokenAddress, this.issuance.borrowingAmount),
              tokenName: this.nutsPlatformService.getTokenNameByAddress(this.issuance.borrowingTokenAddress),
            },
          });
          transactionInitiatedDialog.afterClosed().subscribe(() => {
            this.location.back();
          });
        });

        // Monitoring transaction status(work around for Metamask mobile)
        const interval = setInterval(async () => {
          const receipt = await this.nutsPlatformService.web3.eth.getTransactionReceipt(transactionHash);
          if (!receipt || !receipt.blockNumber) return;

          console.log('Engage receipt', receipt);
          // Engagement success. Need to update borrowing issuance list.
          this.instrumentService.reloadBorrowingIssuances();
          // Engagement success. Need to update account balance as well.
          this.accountBalanceService.updateAccountBalance('borrowing');
          this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
          clearInterval(interval);
        }, 2000);
      });
  }

  repayIssuance() {
    const totalAmount = this.issuance.borrowingAmount + this.issuance.borrowingAmount * this.issuance.interestRate * this.issuance.tenorDays / 1000000;
    console.log('Total amount: ' + totalAmount + ", balance: " + this.borrowingTokenBalance);
    if (this.borrowingTokenBalance < totalAmount) return;
    this.instrumentService.repayIssuance('borrowing', this.issuanceId, this.issuance.borrowingTokenAddress, totalAmount)
      .on('transactionHash', transactionHash => {
        this.zone.run(() => {
          // Opens Engagement Initiated dialog.
          const transactionInitiatedDialog = this.dialog.open(TransactionInitiatedDialog, {
            width: '90%',
            data: {
              type: 'repay_issuance',
              instrument: 'borrowing',
              issuanceId: this.issuance.issuanceId,
              tokenAmount: totalAmount,
              tokenName: this.nutsPlatformService.getTokenNameByAddress(this.issuance.borrowingTokenAddress),
            },
          });
          transactionInitiatedDialog.afterClosed().subscribe(() => {
            this.location.back();
          });
        });

        // Monitoring transaction status(work around for Metamask mobile)
        const interval = setInterval(async () => {
          const receipt = await this.nutsPlatformService.web3.eth.getTransactionReceipt(transactionHash);
          if (!receipt || !receipt.blockNumber) return;

          console.log('Repay receipt', receipt);
          // Repay successful. Need to update the borrowing issuance list
          this.instrumentService.reloadBorrowingIssuances();
          // Repay successful. Need to update the borrowing account balance as well
          this.accountBalanceService.updateAccountBalance('borrowing');
          this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
          clearInterval(interval);
        }, 2000);
      });
  }

  cancelIssuance() {
    this.instrumentService.cancelIssuance('borrowing', this.issuanceId)
      .on('transactionHash', transactionHash => {
        this.zone.run(() => {
          // Opens Cancel Initiated dialog.
          const transactionInitiatedDialog = this.dialog.open(TransactionInitiatedDialog, {
            width: '90%',
            data: {
              type: 'cancel_issuance',
              instrument: 'borrowing',
              issuanceId: this.issuance.issuanceId,
            },
          });
          transactionInitiatedDialog.afterClosed().subscribe(() => {
            this.location.back();
          });
        });

        // Monitoring transaction status(work around for Metamask mobile)
        const interval = setInterval(async () => {
          const receipt = await this.nutsPlatformService.web3.eth.getTransactionReceipt(transactionHash);
          if (!receipt || !receipt.blockNumber) return;

          console.log('Cancel receipt', receipt);
          // Cancel successful. Need to update the borrowing issuance list
          this.instrumentService.reloadBorrowingIssuances();
          // Cancel successful. Need to update the borrowing account as well
          this.accountBalanceService.updateAssetBalance('borrowing', this.borrowingToken);
          this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
          clearInterval(interval);
        }, 2000);
      });
  }

  private updateBorrowingIssuance() {
    this.zone.run(() => {
      this.issuance = this.instrumentService.getBorrowingIssuanceById(this.issuanceId);
      if (this.issuance) {
        console.log('Issuance detail', this.issuance);
        // Compute issuance token values
        this.borrowingToken = this.nutsPlatformService.getTokenNameByAddress(this.issuance.borrowingTokenAddress);
        this.collateralToken = this.nutsPlatformService.getTokenNameByAddress(this.issuance.collateralTokenAddress);
        // If the collateral value is already set
        if (this.issuance.collateralAmount) {
          this.collateralValue = this.issuance.collateralAmount;
          this.collateralSufficient = this.collateralTokenBalance === -1 || this.collateralTokenBalance >= this.collateralValue;
        } else {
          this.priceOracleService.getConvertedValue(this.issuance.collateralTokenAddress, this.issuance.borrowingTokenAddress, this.issuance.borrowingAmount * this.issuance.collateralRatio, 10000).then(value => {
            this.collateralValue = value;
            this.collateralSufficient = this.collateralTokenBalance === -1 || this.collateralTokenBalance >= this.collateralValue;
          });
        }
        this.updateConvertedValue();
      }
    });
  }

  private updateConvertedValue() {
    // Compute converted issuance token values
    const targetTokenAddress = this.currencyService.currency === 'USD' ? USD_ADDRESS : CNY_ADDRESS;
    this.convertedCollateralValue = this.priceOracleService.getConvertedValue(targetTokenAddress,
      this.issuance.borrowingTokenAddress, this.issuance.borrowingAmount * this.issuance.collateralRatio, 10000);
    this.convertedBorrowingValue = this.priceOracleService.getConvertedValue(targetTokenAddress,
      this.issuance.borrowingTokenAddress, this.issuance.borrowingAmount);
    this.convertedPerDayInterestValue = this.priceOracleService.getConvertedValue(targetTokenAddress,
      this.issuance.borrowingTokenAddress, this.issuance.borrowingAmount * this.issuance.interestRate, 1000000);
    this.convertedTotalInterestValue = this.priceOracleService.getConvertedValue(targetTokenAddress,
      this.issuance.borrowingTokenAddress, this.issuance.borrowingAmount * this.issuance.interestRate * this.issuance.tenorDays, 1000000);

  }
}

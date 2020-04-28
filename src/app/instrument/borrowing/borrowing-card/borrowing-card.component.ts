import { Component, Input, OnInit, OnDestroy, NgZone } from '@angular/core';
import { BorrowingIssuanceModel } from 'src/app/common/model/borrowing-issuance.model';
import { NutsPlatformService, USD_ADDRESS, CNY_ADDRESS } from 'src/app/common/web3/nuts-platform.service';
import { PriceOracleService } from 'src/app/common/web3/price-oracle.service';
import { Subscription } from 'rxjs';
import { CurrencyService } from 'src/app/common/currency-select/currency.service';

@Component({
  selector: 'app-borrowing-card',
  templateUrl: './borrowing-card.component.html',
  styleUrls: ['./borrowing-card.component.scss']
})
export class BorrowingCardComponent implements OnInit {
  @Input() public issuance: BorrowingIssuanceModel;
  public currentAccount: string;
  public borrowingToken: string;
  public collateralToken: string;
  public collateralValue = 0;

  public convertedBorrowingValue: Promise<number>;
  public convertedCollateralValue: Promise<number>;
  public convertedPerDayInterestValue: Promise<number>;
  public convertedTotalInterestValue: Promise<number>;
  public showMore = false;

  private currentAccountSubscription: Subscription;
  private currencyUpdatedSubscription: Subscription;

  constructor(public nutsPlatformService: NutsPlatformService, private priceOracleService: PriceOracleService,
              public currencyService: CurrencyService, private zone: NgZone) { }

  ngOnInit() {
    this.currentAccount = this.nutsPlatformService.currentAccount;
    this.currentAccountSubscription = this.nutsPlatformService.currentAccountSubject.subscribe((account) => {
      this.zone.run(() => {
        this.currentAccount = account;
      });
    });
    this.borrowingToken = this.nutsPlatformService.getTokenNameByAddress(this.issuance.borrowingTokenAddress);
    this.collateralToken = this.nutsPlatformService.getTokenNameByAddress(this.issuance.collateralTokenAddress);
    // If the collateral value is not set
    if (this.issuance.collateralAmount == 0) {
      this.priceOracleService.getConvertedValue(this.issuance.collateralTokenAddress, this.issuance.borrowingTokenAddress, this.issuance.borrowingAmount * this.issuance.collateralRatio, 10000).then(value => {
        this.collateralValue = value;
      });
    } else {
      this.collateralValue = this.issuance.collateralAmount;
    }

    // Compute issuance converted token values
    this.updateConvertedValues();
    this.currencyUpdatedSubscription = this.currencyService.currencyUpdatedSubject.subscribe(_ => {
      this.updateConvertedValues();
    });
  }

  ngOnDestroy() {
    this.currentAccountSubscription.unsubscribe();
    this.currencyUpdatedSubscription.unsubscribe();
  }

  private updateConvertedValues() {
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

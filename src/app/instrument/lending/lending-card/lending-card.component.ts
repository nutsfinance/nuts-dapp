import { Component, Input, OnInit, OnDestroy, NgZone } from '@angular/core';

import { LendingIssuanceModel } from 'src/app/common/model/lending-issuance.model';
import { NutsPlatformService, USD_ADDRESS, CNY_ADDRESS } from 'src/app/common/web3/nuts-platform.service';
import { PriceOracleService } from 'src/app/common/web3/price-oracle.service';
import { Subscription } from 'rxjs';
import { CurrencyService } from 'src/app/common/currency-select/currency.service';
import { LanguageService } from '../../../common/web3/language.service';

@Component({
  selector: 'app-lending-card',
  templateUrl: './lending-card.component.html',
  styleUrls: ['./lending-card.component.scss']
})
export class LendingCardComponent implements OnInit, OnDestroy {
  @Input() public issuance: LendingIssuanceModel;
  public currentAccount: string;
  public lendingToken: string;
  public collateralToken: string;
  public collateralValue = 0;

  public convertedLendingValue: Promise<number>;
  public convertedCollateralValue: Promise<number>;
  public convertedPerDayInterestValue: Promise<number>;
  public convertedTotalInterestValue: Promise<number>;
  public showMore = false;

  private currentAccountSubscription: Subscription;
  private currencyUpdatedSubscription: Subscription;

  constructor(public nutsPlatformService: NutsPlatformService, private priceOracleService: PriceOracleService,
    public languageService: LanguageService, public currencyService: CurrencyService, private zone: NgZone) { }

  ngOnInit() {
    this.currentAccount = this.nutsPlatformService.currentAccount;
    this.currentAccountSubscription = this.nutsPlatformService.currentAccountSubject.subscribe((account) => {
      this.zone.run(() => {
        this.currentAccount = account;
      });
    });
    this.lendingToken = this.nutsPlatformService.getTokenNameByAddress(this.issuance.lendingTokenAddress);
    this.collateralToken = this.nutsPlatformService.getTokenNameByAddress(this.issuance.collateralTokenAddress);
    // If the collateral value is not set
    if (this.issuance.collateralAmount == 0) {
      this.priceOracleService.getConvertedValue(this.issuance.collateralTokenAddress, this.issuance.lendingTokenAddress, this.issuance.lendingAmount * this.issuance.collateralRatio, 10000).then(value => {
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
      this.issuance.lendingTokenAddress, this.issuance.lendingAmount * this.issuance.collateralRatio, 10000);
    this.convertedLendingValue = this.priceOracleService.getConvertedValue(targetTokenAddress,
      this.issuance.lendingTokenAddress, this.issuance.lendingAmount);
    this.convertedPerDayInterestValue = this.priceOracleService.getConvertedValue(targetTokenAddress,
      this.issuance.lendingTokenAddress, this.issuance.lendingAmount * this.issuance.interestRate, 1000000);
    this.convertedTotalInterestValue = this.priceOracleService.getConvertedValue(targetTokenAddress,
      this.issuance.lendingTokenAddress, this.issuance.lendingAmount * this.issuance.interestRate * this.issuance.tenorDays, 1000000);
  }
}

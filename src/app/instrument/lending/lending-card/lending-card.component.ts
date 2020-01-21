import { Component, Input, OnInit, OnDestroy, NgZone } from '@angular/core';
import { LendingIssuanceModel } from 'src/app/common/model/lending-issuance.model';
import { NutsPlatformService, USD_ADDRESS, CNY_ADDRESS } from 'src/app/common/web3/nuts-platform.service';
import { PriceOracleService } from 'src/app/common/web3/price-oracle.service';
import { Subscription } from 'rxjs';
import { CurrencyService } from 'src/app/common/currency-select/currency.service';

@Component({
  selector: 'app-lending-card',
  templateUrl: './lending-card.component.html',
  styleUrls: ['./lending-card.component.scss']
})
export class LendingCardComponent implements OnInit, OnDestroy {
  @Input() private issuance: LendingIssuanceModel;
  private currentAccount: string;
  private lendingToken: string;
  private lendingValue: number;
  private collateralToken: string;
  private collateralValue: Promise<number>;

  private convertedLendingValue: Promise<number>;
  private convertedCollateralValue: Promise<number>;
  private convertedPerDayInterestValue: Promise<number>;
  private convertedTotalInterestValue: Promise<number>;

  private showMore = false;
  private currentAccountSubscription: Subscription;
  private currencyUpdatedSubscription: Subscription;

  constructor(private nutsPlatformService: NutsPlatformService, private priceOracleService: PriceOracleService,
              private currencyService: CurrencyService, private zone: NgZone) { }

  ngOnInit() {
    this.currentAccount = this.nutsPlatformService.currentAccount;
    this.currentAccountSubscription = this.nutsPlatformService.currentAccountSubject.subscribe((account) => {
      this.zone.run(() => {
        this.currentAccount = account;
      });
    });
    this.lendingToken = this.nutsPlatformService.getTokenNameByAddress(this.issuance.lendingTokenAddress);
    this.lendingValue = this.nutsPlatformService.getTokenValueByAddress(this.issuance.lendingTokenAddress, this.issuance.lendingAmount);
    this.collateralToken = this.nutsPlatformService.getTokenNameByAddress(this.issuance.collateralTokenAddress);
    this.collateralValue = this.issuance.collateralAmount ? Promise.resolve(this.nutsPlatformService.getTokenValueByAddress(this.issuance.lendingTokenAddress, this.issuance.collateralAmount)) :
      this.priceOracleService.getConvertedValue(this.issuance.collateralTokenAddress, this.issuance.lendingTokenAddress, this.lendingValue * this.issuance.collateralRatio, 10000);
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
      this.issuance.lendingTokenAddress, this.lendingValue * this.issuance.collateralRatio, 10000);
    this.convertedLendingValue = this.priceOracleService.getConvertedValue(targetTokenAddress, this.issuance.lendingTokenAddress, this.lendingValue);
    this.convertedPerDayInterestValue = this.priceOracleService.getConvertedValue(targetTokenAddress, this.issuance.lendingTokenAddress,
      this.lendingValue * this.issuance.interestRate, 1000000);
    this.convertedTotalInterestValue = this.priceOracleService.getConvertedValue(targetTokenAddress, this.issuance.lendingTokenAddress,
      this.lendingValue * this.issuance.interestRate * this.issuance.tenorDays, 1000000);
  }
}

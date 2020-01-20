import { Location } from '@angular/common';
import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { LendingIssuanceModel } from 'src/app/common/model/lending-issuance.model';
import { NutsPlatformService, USD_ADDRESS, CNY_ADDRESS } from 'src/app/common/web3/nuts-platform.service';
import { PriceOracleService } from 'src/app/common/web3/price-oracle.service';
import { CurrencyService } from 'src/app/common/currency-select/currency.service';

@Component({
  selector: 'app-lending-detail',
  templateUrl: './lending-detail.component.html',
  styleUrls: ['./lending-detail.component.scss']
})
export class LendingDetailComponent implements OnInit, OnDestroy {
  private issuanceId: number;
  private issuance: LendingIssuanceModel;
  private lendingToken: string;
  private lendingValue: number;
  private collateralToken: string;
  private lendingTokenBalance: number = -1;
  private collateralTokenBalance: number = -1;
  private collateralValue = 0;
  private perDayInterestValue;
  private totalInterestValue;

  private convertedCollateralValue: Promise<number>;
  private convertedLendingValue: Promise<number>;
  private convertedPerDayInterestValue: Promise<number>;
  private convertedTotalInterestValue: Promise<number>;

  private accountUpdatedSubscription: Subscription;
  private issuanceIdSubscription: Subscription;
  private lendingUpdatedSubscription: Subscription;
  private currencyUpdatedSubscription: Subscription;

  constructor(private nutsPlatformService: NutsPlatformService, private priceOracleService: PriceOracleService,
              private currencyService: CurrencyService, private route: ActivatedRoute, private zone: NgZone,
              private location: Location) { }

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
    this.lendingUpdatedSubscription = this.nutsPlatformService.lendingIssuancesUpdatedSubject.subscribe(_ => {
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

  async engageIssuance() {
    if (this.collateralTokenBalance >= this.collateralValue) {
      const result = await this.nutsPlatformService.engageIssuance('lending', this.issuanceId);
      console.log(result);
    }
  }

  async repayIssuance() {
    if (this.collateralTokenBalance >= this.lendingValue + this.totalInterestValue) {
      const result = await this.nutsPlatformService.repayIssuance('lending', this.issuanceId, this.issuance.lendingTokenAddress,
        this.issuance.lendingAmount + this.issuance.interestAmount);
      console.log(result);
    }
  }

  async cancelIssuance() {
    const result = await this.nutsPlatformService.cancelIssuance('lending', this.issuanceId);
    console.log(result);
  }

  private updateLendingIssuance() {
    this.zone.run(() => {
      this.issuance = this.nutsPlatformService.getLendingIssuance(this.issuanceId);
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
      }
    });
  }
}

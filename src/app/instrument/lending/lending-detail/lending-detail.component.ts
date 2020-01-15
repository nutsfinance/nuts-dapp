import {Location} from '@angular/common';
import {Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Subscription} from 'rxjs';
import {LendingIssuanceModel} from 'src/app/common/model/lending-issuance.model';
import {NutsPlatformService, USD_ADDRESS} from 'src/app/common/web3/nuts-platform.service';
import {PriceOracleService} from 'src/app/common/web3/price-oracle.service';

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

  private collateralValue: Promise<number>;
  private convertedCollateralValue: Promise<number>;
  private convertedLendingValue: Promise<number>;
  private convertedPerDayInterestValue: Promise<number>;
  private convertedTotalInterestValue: Promise<number>;

  private accountUpdatedSubscription: Subscription;
  private issuanceIdSubscription: Subscription;
  private lendingUpdatedSubscription: Subscription;

  constructor(private nutsPlatformService: NutsPlatformService, private priceOracleService: PriceOracleService,
    private route: ActivatedRoute, private zone: NgZone, private location: Location) {}

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
  }

  ngOnDestroy() {
    this.accountUpdatedSubscription.unsubscribe();
    this.issuanceIdSubscription.unsubscribe();
    this.lendingUpdatedSubscription.unsubscribe();
  }

  async getConvertedValue(baseTokenAddress: string, quoteTokenAddress: string, baseTokenAmount: number) {
    console.log(baseTokenAddress, quoteTokenAddress, baseTokenAmount);
    const result = await this.priceOracleService.getPrice(baseTokenAddress, quoteTokenAddress);
    console.log(result);
    return baseTokenAmount * result[1] / result[0];
  }

  navigateBack() {
    this.location.back();
  }

  engageIssuance() {

  }

  repayIssuance() {

  }

  async cancelIssuance() {
    const result = await this.nutsPlatformService.cancelIssuance('lending', this.issuanceId);
    console.log(result);
  }

  private updateLendingIssuance() {
    this.zone.run(() => {
      this.issuance = this.nutsPlatformService.getLendingIssuance(this.issuanceId);
      console.log(this.issuance);
      if (this.issuance) {
        console.log(this.issuance.makerAddress, this.nutsPlatformService.currentAccount);
        this.lendingToken = this.nutsPlatformService.getTokenNameByAddress(this.issuance.lendingTokenAddress);
        this.lendingValue = this.nutsPlatformService.getTokenValueByAddress(this.issuance.lendingTokenAddress, this.issuance.lendingAmount);
        this.collateralToken = this.nutsPlatformService.getTokenNameByAddress(this.issuance.collateralTokenAddress);

        this.collateralValue = this.getConvertedValue(this.issuance.collateralTokenAddress,
          this.issuance.lendingTokenAddress, this.lendingValue * this.issuance.collateralRatio / 10000);
        this.convertedCollateralValue = this.getConvertedValue(USD_ADDRESS,
          this.issuance.lendingTokenAddress, this.lendingValue * this.issuance.collateralRatio / 10000);
        this.convertedLendingValue = this.getConvertedValue(USD_ADDRESS, this.issuance.lendingTokenAddress, this.lendingValue);
        this.convertedPerDayInterestValue = this.getConvertedValue(USD_ADDRESS, this.issuance.lendingTokenAddress,
          this.lendingValue * this.issuance.interestRate / 1000000);
        this.convertedTotalInterestValue = this.getConvertedValue(USD_ADDRESS, this.issuance.lendingTokenAddress,
          this.lendingValue * this.issuance.interestRate * this.issuance.tenorDays / 1000000);
      }
    });
  }
}

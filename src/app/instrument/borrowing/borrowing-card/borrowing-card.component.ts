import { Component, Input, OnInit, OnDestroy, NgZone } from '@angular/core';

import { environment } from '../../../../environments/environment';
import { IssuanceModel } from '../../issuance.model';
import { NutsPlatformService, USD_ADDRESS, CNY_ADDRESS } from 'src/app/common/web3/nuts-platform.service';
import { PriceOracleService } from 'src/app/common/web3/price-oracle.service';
import { Subscription } from 'rxjs';
import { CurrencyService } from 'src/app/common/currency-select/currency.service';
import { BorrowingIssuanceModel } from '../borrowing-issuance.model';
import { TokenModel } from 'src/app/common/token/token.model';
import { TokenService } from 'src/app/common/token/token.service';

@Component({
  selector: 'app-borrowing-card',
  templateUrl: './borrowing-card.component.html',
  styleUrls: ['./borrowing-card.component.scss']
})
export class BorrowingCardComponent implements OnInit, OnDestroy {
  @Input() public issuance: IssuanceModel;
  public borrowingIssuance: BorrowingIssuanceModel;
  public language = environment.language;
  public currentAccount: string;
  public borrowingToken: TokenModel;
  public collateralToken: TokenModel;
  public collateralValue = 0;

  public convertedBorrowingValue: Promise<number>;
  public convertedCollateralValue: Promise<number>;
  public convertedPerDayInterestValue: Promise<number>;
  public convertedTotalInterestValue: Promise<number>;
  public showState = 'less';

  private currencyUpdatedSubscription: Subscription;

  constructor(public nutsPlatformService: NutsPlatformService, private priceOracleService: PriceOracleService,
    private tokenService: TokenService, public currencyService: CurrencyService, private zone: NgZone) { }

  ngOnInit() {
    this.currentAccount = this.nutsPlatformService.currentAccount;
    this.borrowingIssuance = this.issuance.issuancecustomproperty as BorrowingIssuanceModel;
    this.borrowingToken = this.tokenService.getTokenByAddress(this.borrowingIssuance.borrowingtokenaddress);
    this.collateralToken = this.tokenService.getTokenByAddress(this.borrowingIssuance.collateraltokenaddress);
    // If the collateral value is not set
    if (this.borrowingIssuance.collateralamount == 0) {
      const collateralDisplayValue = this.tokenService.getDisplayValue
      this.priceOracleService.getConvertedValue(this.issuance.collateralTokenAddress, this.issuance.borrowingTokenAddress, this.issuance.borrowingAmount * this.issuance.collateralRatio, 10000).then(value => {
        this.collateralValue = value;
      });
    } else {
      this.collateralValue = this.borrowingIssuance.collateralamount;
    }

    // Compute issuance converted token values
    this.updateConvertedValues();
    this.currencyUpdatedSubscription = this.currencyService.currencyUpdatedSubject.subscribe(_ => {
      this.updateConvertedValues();
    });
  }

  ngOnDestroy() {
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

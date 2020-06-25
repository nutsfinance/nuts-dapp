import { Component, Input, OnInit, OnDestroy, NgZone } from '@angular/core';

import { environment } from '../../../../environments/environment';
import { NutsPlatformService } from 'src/app/common/web3/nuts-platform.service';
import { PriceOracleService } from 'src/app/common/web3/price-oracle.service';
import { Subscription } from 'rxjs';
import { CurrencyService } from 'src/app/common/currency-select/currency.service';
import { TokenModel } from 'src/app/common/token/token.model';
import { IssuanceModel, UserRole, OfferState } from '../../issuance.model';
import { LendingIssuanceModel } from '../lending-issuance.model';
import { TokenService } from 'src/app/common/token/token.service';
import { LendingService } from '../lending.service';

@Component({
  selector: 'app-lending-card',
  templateUrl: './lending-card.component.html',
  styleUrls: ['./lending-card.component.scss']
})
export class LendingCardComponent implements OnInit, OnDestroy {
  @Input() public issuance: IssuanceModel;
  public lendingIssuance: LendingIssuanceModel;
  public role: UserRole;
  public offerState: OfferState;
  public language = environment.language;
  public lendingToken: TokenModel;
  public collateralToken: TokenModel;
  public collateralValue = '0';

  public convertedLendingValue: Promise<number>;
  public convertedCollateralValue: Promise<number>;
  public convertedPerDayInterestValue: Promise<number>;
  public convertedTotalInterestValue: Promise<number>;
  public showState = 'less';

  private currencyUpdatedSubscription: Subscription;

  constructor(public nutsPlatformService: NutsPlatformService, private priceOracleService: PriceOracleService,
    public lendingService: LendingService, private tokenService: TokenService,
    public currencyService: CurrencyService, private zone: NgZone) { }

  ngOnInit() {
    this.lendingIssuance = this.issuance.issuancecustomproperty as LendingIssuanceModel;
    this.role = this.lendingService.getUserRole(this.issuance);
    this.offerState = this.lendingService.getOfferState(this.issuance);
    this.lendingToken = this.tokenService.getTokenByAddress(this.lendingIssuance.lendingtokenaddress);
    this.collateralToken = this.tokenService.getTokenByAddress(this.lendingIssuance.collateraltokenaddress);
    // If the collateral value is not set
    if (!this.lendingIssuance.collateralamount || this.lendingIssuance.collateralamount === '0') {
      this.lendingService.getCollateralValue(this.lendingToken, this.collateralToken, this.lendingIssuance.lendingamount,
        +this.lendingIssuance.collateralratio / 10000).then(value => {
          this.collateralValue = value;
          this.convertedCollateralValue = this.priceOracleService.getConvertedCurrencyValue(this.collateralToken, value);
        });
    } else {
      this.collateralValue = this.lendingIssuance.collateralamount;
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
    this.convertedCollateralValue = this.priceOracleService.getConvertedCurrencyValue(this.collateralToken, this.collateralValue);
    this.convertedLendingValue = this.priceOracleService.getConvertedCurrencyValue(this.lendingToken, this.lendingIssuance.lendingamount);
    this.convertedPerDayInterestValue = this.priceOracleService.getConvertedCurrencyValue(this.lendingToken,
      this.lendingService.getPerDayInterest(this.lendingIssuance));
    this.convertedTotalInterestValue = this.priceOracleService.getConvertedCurrencyValue(this.lendingToken,
      this.lendingIssuance.interestamount);
  }
}

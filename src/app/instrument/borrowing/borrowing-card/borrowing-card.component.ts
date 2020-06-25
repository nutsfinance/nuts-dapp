import { Component, Input, OnInit, OnDestroy, NgZone } from '@angular/core';

import { environment } from '../../../../environments/environment';
import { IssuanceModel, UserRole, OfferState } from '../../issuance.model';
import { NutsPlatformService } from 'src/app/common/web3/nuts-platform.service';
import { PriceOracleService } from 'src/app/common/web3/price-oracle.service';
import { Subscription } from 'rxjs';
import { CurrencyService } from 'src/app/common/currency-select/currency.service';
import { BorrowingIssuanceModel } from '../borrowing-issuance.model';
import { TokenModel } from 'src/app/common/token/token.model';
import { TokenService } from 'src/app/common/token/token.service';
import { BorrowingService } from '../borrowing.service';

@Component({
  selector: 'app-borrowing-card',
  templateUrl: './borrowing-card.component.html',
  styleUrls: ['./borrowing-card.component.scss']
})
export class BorrowingCardComponent implements OnInit, OnDestroy {
  @Input() public issuance: IssuanceModel;
  public borrowingIssuance: BorrowingIssuanceModel;
  public role: UserRole;
  public offerState: OfferState;
  public language = environment.language;
  public borrowingToken: TokenModel;
  public collateralToken: TokenModel;
  public collateralValue = '0';

  public convertedBorrowingValue: Promise<number>;
  public convertedCollateralValue: Promise<number>;
  public convertedPerDayInterestValue: Promise<number>;
  public convertedTotalInterestValue: Promise<number>;
  public showState = 'less';

  private currencyUpdatedSubscription: Subscription;

  constructor(public nutsPlatformService: NutsPlatformService, private priceOracleService: PriceOracleService,
    private borrowingService: BorrowingService, private tokenService: TokenService, public currencyService: CurrencyService, private zone: NgZone) { }

  ngOnInit() {
    this.borrowingIssuance = this.issuance.issuancecustomproperty as BorrowingIssuanceModel;
    this.role = this.borrowingService.getUserRole(this.issuance);
    this.offerState = this.borrowingService.getOfferState(this.issuance);
    this.borrowingToken = this.tokenService.getTokenByAddress(this.borrowingIssuance.borrowingtokenaddress);
    this.collateralToken = this.tokenService.getTokenByAddress(this.borrowingIssuance.collateraltokenaddress);
    // If the collateral value is not set
    if (this.borrowingIssuance.collateralamount === '0') {
      this.borrowingService.getBorrowingCollateralValue(this.borrowingIssuance).then(value => {
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
    // Compute converted issuance token values
    this.convertedCollateralValue = this.priceOracleService.getConvertedCurrencyValue(this.collateralToken, this.collateralValue);
    this.convertedBorrowingValue = this.priceOracleService.getConvertedCurrencyValue(this.borrowingToken, this.borrowingIssuance.borrowingamount);
    this.convertedPerDayInterestValue = this.priceOracleService.getConvertedCurrencyValue(this.borrowingToken,
      this.borrowingService.getPerDayInterest(this.borrowingIssuance));
    this.convertedTotalInterestValue = this.priceOracleService.getConvertedCurrencyValue(this.borrowingToken,
      this.borrowingIssuance.interestamount);
  }

}

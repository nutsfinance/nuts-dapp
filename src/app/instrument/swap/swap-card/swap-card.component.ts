import { Component, Input, OnInit, OnDestroy, NgZone } from '@angular/core';

import { environment } from '../../../../environments/environment';
import { NutsPlatformService, USD_ADDRESS, CNY_ADDRESS } from 'src/app/common/web3/nuts-platform.service';
import { PriceOracleService } from 'src/app/common/web3/price-oracle.service';
import { Subscription } from 'rxjs';
import { TokenModel } from 'src/app/common/token/token.model';
import { TokenService } from 'src/app/common/token/token.service';
import { IssuanceModel } from '../../issuance.model';
import { SwapIssuanceModel } from '../swap-issuance.model';
import { CurrencyService } from 'src/app/common/currency-select/currency.service';

@Component({
  selector: 'app-swap-card',
  templateUrl: './swap-card.component.html',
  styleUrls: ['./swap-card.component.scss']
})
export class SwapCardComponent implements OnInit, OnDestroy {
  @Input() public issuance: IssuanceModel;
  public swapIssuance: SwapIssuanceModel;
  public language = environment.language;
  public inputToken: TokenModel;
  public outputToken: TokenModel;
  public exchangeRate: number;

  public convertedInputValue: Promise<number>;
  public convertedOutputValue: Promise<number>;
  public showState = 'less';

  private currencyUpdatedSubscription: Subscription;

  constructor(public nutsPlatformService: NutsPlatformService, private priceOracleService: PriceOracleService,
    public tokenService: TokenService, private currencyService: CurrencyService, private zone: NgZone) { }

  ngOnInit() {
    this.swapIssuance = this.issuance.issuancecustomproperty as SwapIssuanceModel;
    this.inputToken = this.tokenService.getTokenByAddress(this.swapIssuance.inputtokenaddress);
    this.outputToken = this.tokenService.getTokenByAddress(this.swapIssuance.outputtokenaddress);
    this.exchangeRate = 1.0 * this.tokenService.getDisplayValue(this.outputToken.tokenAddress, this.swapIssuance.outputamount)
      / this.tokenService.getDisplayValue(this.inputToken.tokenAddress, this.swapIssuance.inputamount);

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
    this.convertedInputValue = this.priceOracleService.getConvertedCurrencyValue(this.inputToken,
      this.swapIssuance.inputamount);
    this.convertedOutputValue = this.priceOracleService.getConvertedCurrencyValue(this.outputToken,
      this.swapIssuance.outputamount);
  }
}

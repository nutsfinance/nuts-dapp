import { Component, Input, OnInit, OnDestroy, NgZone } from '@angular/core';
import { SwapIssuanceModel } from 'src/app/common/model/swap-issuance.model';
import { NutsPlatformService, USD_ADDRESS, CNY_ADDRESS } from 'src/app/common/web3/nuts-platform.service';
import { PriceOracleService } from 'src/app/common/web3/price-oracle.service';
import { Subscription } from 'rxjs';
import { CurrencyService } from 'src/app/common/currency-select/currency.service';

@Component({
  selector: 'app-swap-card',
  templateUrl: './swap-card.component.html',
  styleUrls: ['./swap-card.component.scss']
})
export class SwapCardComponent implements OnInit, OnDestroy {
  @Input() public issuance: SwapIssuanceModel;
  public currentAccount: string;
  public inputToken: string;
  public outputToken: string;
  public exchangeRate: number;

  public convertedInputValue: Promise<number>;
  public convertedOutputValue: Promise<number>;
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
    this.inputToken = this.nutsPlatformService.getTokenNameByAddress(this.issuance.inputTokenAddress);
    this.outputToken = this.nutsPlatformService.getTokenNameByAddress(this.issuance.outputTokenAddress);
    this.exchangeRate = 1.0 * this.nutsPlatformService.getDisplayValueByName(this.outputToken, this.issuance.outputAmount) / this.nutsPlatformService.getDisplayValueByName(this.inputToken, this.issuance.inputAmount);

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
    this.convertedInputValue = this.priceOracleService.getConvertedValue(targetTokenAddress,
      this.issuance.inputTokenAddress, this.issuance.inputAmount);
    this.convertedOutputValue = this.priceOracleService.getConvertedValue(targetTokenAddress,
      this.issuance.outputTokenAddress, this.issuance.outputAmount);
  }
}

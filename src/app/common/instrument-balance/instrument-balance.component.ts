import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { UserBalanceService } from '../web3/user-balance.service';
import { CurrencyService } from '../currency-select/currency.service';
import { PriceOracleService } from '../web3/price-oracle.service';
import { USD_ADDRESS, CNY_ADDRESS, NutsPlatformService } from '../web3/nuts-platform.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-instrument-balance',
  templateUrl: './instrument-balance.component.html',
  styleUrls: ['./instrument-balance.component.scss']
})
export class InstrumentBalanceComponent implements OnInit, OnDestroy {
  @Input() instrument = '';
  private instrumentName = '';
  private instrumentBalance: Promise<Number>;
  private userBalanceSubscription: Subscription;
  private currencySubscription: Subscription;

  constructor(private nutsPlatformSevice: NutsPlatformService, private userBalanceService: UserBalanceService,
    private currencyService: CurrencyService, private priceOracleService: PriceOracleService) { }

  ngOnInit() {
    this.instrumentName = this.instrument.charAt(0).toUpperCase() + this.instrument.substring(1);
    this.instrumentBalance = this.getInstrumentBalance();
    this.currencySubscription = this.currencyService.currencyUpdatedSubject.subscribe(_ => {
      this.instrumentBalance = this.getInstrumentBalance();
    });
    this.userBalanceSubscription = this.userBalanceService.userBalanceSubject.subscribe(_ => {
      this.instrumentBalance = this.getInstrumentBalance();
    });
  }

  ngOnDestroy() {
    this.currencySubscription.unsubscribe();
  }

  private async getInstrumentBalance() {
    const userBalance = this.userBalanceService.userBalance;
    if (!userBalance[this.instrumentName]) {
      console.log('Instrument ' + this.instrumentName + '  does not exist');
      return 0;
    }
    const assets = ["ETH", "USDC", "USDC", "NUTS", "DAI"];
    const targetTokenAddress = this.currencyService.currency === 'USD' ? USD_ADDRESS : CNY_ADDRESS;
    let totalValue = 0;
    for (let i = 0; i < assets.length; i++) {
      if (!userBalance[this.instrumentName][assets[i]]) continue;
      const assetAddress = this.nutsPlatformSevice.getTokenAddressByName(assets[i]);
      const assetValue = this.nutsPlatformSevice.getTokenValueByAddress(assetAddress, userBalance[this.instrumentName][assets[i]]);
      totalValue += await this.priceOracleService.getConvertedValue(targetTokenAddress, assetAddress, assetValue);
    }

    return totalValue;
  }
}

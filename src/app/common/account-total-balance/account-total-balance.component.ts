import { Component, OnInit, OnDestroy, Input, NgZone } from '@angular/core';
import { AccountBalanceService } from '../web3/account-balance.service';
import { CurrencyService } from '../currency-select/currency.service';
import { PriceOracleService } from '../web3/price-oracle.service';
import { USD_ADDRESS, CNY_ADDRESS, NutsPlatformService } from '../web3/nuts-platform.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-account-total-balance',
  templateUrl: './account-total-balance.component.html',
  styleUrls: ['./account-total-balance.component.scss']
})
export class AccountTotalBalanceComponent implements OnInit, OnDestroy {
  @Input() instrument = '';
  public instrumentName = '';
  public instrumentBalance: Promise<Number>;

  private userBalanceSubscription: Subscription;
  private currencySubscription: Subscription;

  constructor(private nutsPlatformSevice: NutsPlatformService, private userBalanceService: AccountBalanceService,
    public currencyService: CurrencyService, private priceOracleService: PriceOracleService, private zone: NgZone) { }

  ngOnInit() {
    this.instrumentName = this.instrument.charAt(0).toUpperCase() + this.instrument.substring(1);
    this.instrumentBalance = this.getInstrumentBalance();
    this.currencySubscription = this.currencyService.currencyUpdatedSubject.subscribe(_ => {
      this.instrumentBalance = this.getInstrumentBalance();
    });
    this.userBalanceSubscription = this.userBalanceService.userBalanceSubject.subscribe(userBalance => {
      console.log('Instrument balance: User balance updated', userBalance);
      this.zone.run(() => this.instrumentBalance = this.getInstrumentBalance());
    });
  }

  ngOnDestroy() {
    this.userBalanceSubscription.unsubscribe();
    this.currencySubscription.unsubscribe();
  }

  private async getInstrumentBalance() {
    const userBalance = this.userBalanceService.userBalance;
    if (!userBalance[this.instrument]) {
      console.log('Instrument ' + this.instrument + '  does not exist');
      return 0;
    }
    const assets = ["ETH", "USDC", "USDT", "NUTS", "DAI"];
    const targetTokenAddress = this.currencyService.currency === 'USD' ? USD_ADDRESS : CNY_ADDRESS;
    let totalValue = 0;
    for (let i = 0; i < assets.length; i++) {
      if (!userBalance[this.instrument][assets[i]]) continue;
      const assetAddress = this.nutsPlatformSevice.getTokenAddressByName(assets[i]);
      const assetValue = this.nutsPlatformSevice.getTokenValueByAddress(assetAddress, userBalance[this.instrument][assets[i]]);
      totalValue += await this.priceOracleService.getConvertedValue(targetTokenAddress, assetAddress, assetValue);
    }

    console.log('Total value', totalValue);
    return totalValue;
  }
}

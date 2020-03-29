import { Component, OnInit, OnDestroy, Input, NgZone } from '@angular/core';
import { AccountBalanceService } from '../web3/account-balance.service';
import { CurrencyService } from '../currency-select/currency.service';
import { PriceOracleService } from '../web3/price-oracle.service';
import { USD_ADDRESS, CNY_ADDRESS, NutsPlatformService } from '../web3/nuts-platform.service';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material';
import { AccountBalanceDialog } from './account-balance-doalog.component';

@Component({
  selector: 'app-account-total-balance',
  templateUrl: './account-total-balance.component.html',
  styleUrls: ['./account-total-balance.component.scss']
})
export class AccountTotalBalanceComponent implements OnInit, OnDestroy {
  @Input() instrument = '';
  public instrumentName = '';
  public instrumentBalance: Promise<Number>;

  private accountBalancesSubscription: Subscription;
  private currencySubscription: Subscription;

  constructor(private nutsPlatformSevice: NutsPlatformService, private accountBalanceService: AccountBalanceService,
    public currencyService: CurrencyService, private priceOracleService: PriceOracleService, private zone: NgZone,
    private dialog: MatDialog) { }

  ngOnInit() {
    this.instrumentName = this.instrument.charAt(0).toUpperCase() + this.instrument.substring(1);
    this.instrumentBalance = this.getInstrumentAccountBalance();
    this.currencySubscription = this.currencyService.currencyUpdatedSubject.subscribe(_ => {
      this.instrumentBalance = this.getInstrumentAccountBalance();
    });
    this.accountBalancesSubscription = this.accountBalanceService.accountBalancesSubject.subscribe(accountBalances => {
      console.log('Account total balance: Account balances updated', accountBalances);
      this.zone.run(() => this.instrumentBalance = this.getInstrumentAccountBalance());
    });
  }

  ngOnDestroy() {
    this.accountBalancesSubscription.unsubscribe();
    this.currencySubscription.unsubscribe();
  }

  openDialog() {
    this.dialog.open(AccountBalanceDialog, {
      width: '90%',
      data: {
        instrument: this.instrument
      }
    });
  }

  private async getInstrumentAccountBalance() {
    const userBalance = this.accountBalanceService.accountBalances;
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
      totalValue += await this.priceOracleService.getConvertedValue(targetTokenAddress, assetAddress, userBalance[this.instrument][assets[i]]);
    }

    console.log('Total value', totalValue);
    return totalValue;
  }
}

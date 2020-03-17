import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { MultiDataSet, Label } from 'ng2-charts';
import { UserBalanceService, UserBalance } from 'src/app/common/web3/user-balance.service';
import { Subscription } from 'rxjs';
import { PriceOracleService } from 'src/app/common/web3/price-oracle.service';
import { NutsPlatformService, USD_ADDRESS, CNY_ADDRESS } from 'src/app/common/web3/nuts-platform.service';
import { CurrencyService } from 'src/app/common/currency-select/currency.service';

@Component({
  selector: 'app-dashboard-account-balance',
  templateUrl: './dashboard-account-balance.component.html',
  styleUrls: ['./dashboard-account-balance.component.scss']
})
export class DashboardAccountBalanceComponent implements OnInit, OnDestroy {
  private instruments = ['Lending', 'Borrowing', 'Swap', 'Placeholder'];
  private assets = ['ETH', 'USDT', 'USDC', 'NUTS', 'DAI', 'Placeholder'];

  public totalValue = 0;
  public instrumentValue = [0, 0, 0];
  public instrumentPercentage = [0, 0, 0];
  public assetValue = [0, 0, 0, 0, 0];
  public assetPercentage = [0, 0, 0, 0, 0];

  // Instrument Chart
  public instrumentChartLabels: Label[] = this.instruments;;
  public instrumentChartColors = [{
    backgroundColor: [
      '#617835',
      '#82C34D',
      '#BCA795',
      '#E0E4D7',
    ]
  }];

  public instrumentChartData: MultiDataSet = [
    [350, 450, 100],
  ];
  public instrumentChartOptions = {
    title: {
      display: true,
      text: 'Instruments Balance',
    },
    legend: {
      position: 'bottom',
      labels: {
        fontFamily: '"GillSans-light", Helvetica, Arial, serif',
        padding: 16,
        filter: function(legend, data) {
          // return true;
          return legend.text.indexOf("Placeholder") < 0;  // Don't show placeholder legend!
        }
      }
    },
    aspectRatio: 1.19,
    tooltips: {
      enabled: true,
      callbacks: {
        label: this.getInstrumentTooltip.bind(this)
      }
    }
  };

  // Asset Chart
  public assetChartLabels: Label[] = this.assets;
  public assetChartColors = [{
    backgroundColor: [
      '#627EEA',
      '#53AE94',
      '#2775CA',
      '#80C14D',
      '#FAB44B',
      '#F1EDEA',
    ]
  }];
  public assetChartData: MultiDataSet = [
    [10, 20, 30, 40, 50]
  ];
  public assetChartOptions = {
    title: {
      display: true,
      text: 'Assets Balance'
    },
    legend: {
      position: 'bottom',
      padding: 16,
      labels: {
        fontFamily: '"GillSans-light", Helvetica, Arial, serif',
        filter: function(legend, data) {
          // return true;
          return legend.text.indexOf("Placeholder") < 0;  // Don't show placeholder legend!
        }
      }
    },
    aspectRatio: 1.18,
    tooltips: {
      enabled: true,
      callbacks: {
        label: this.getAssetTooltip.bind(this)
      }
    }
  }

  private userBalanceSubscription: Subscription;
  private currencySubscription: Subscription;

  constructor(private userBalanceService: UserBalanceService, private priceOracleService: PriceOracleService,
    private nutsPlatformService: NutsPlatformService, public currencyService: CurrencyService, private zone: NgZone) { }

  ngOnInit() {
    // Try to read the latest user balance.
    this.userBalanceService.getUserBalanceOnChain();
    this.userBalanceSubscription = this.userBalanceService.userBalanceSubject.subscribe(userBalance => {
      this.zone.run(() => {
        this.updateUserBalance(userBalance);
      });
    });
    this.currencySubscription = this.currencyService.currencyUpdatedSubject.subscribe(_ => {
      this.zone.run(() => {
        this.updateUserBalance(this.userBalanceService.userBalance);
      });
    });
  }

  ngOnDestroy() {
    this.userBalanceSubscription.unsubscribe();
    this.currencySubscription.unsubscribe();
  }

  private async updateUserBalance(userBalance: UserBalance) {
    const instrumentsValue = [0, 0, 0, 0];
    const assetsValue = [0, 0, 0, 0, 0, 0];
    const targetTokenAddress = this.currencyService.currency === 'USD' ? USD_ADDRESS : CNY_ADDRESS;
    let totalValue = 0;
    // For each instrument
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 5; j++) {
        const instrument = this.instruments[i].toLowerCase();
        const asset = this.assets[j];
        if (!userBalance[instrument] || !userBalance[instrument][asset]) continue;

        const assetAddress = this.nutsPlatformService.getTokenAddressByName(asset);
        const assetValue = this.nutsPlatformService.getTokenValueByAddress(assetAddress, userBalance[instrument][asset]);
        const assetConvertedValue = await this.priceOracleService.getConvertedValue(targetTokenAddress, assetAddress, assetValue);

        instrumentsValue[i] += assetConvertedValue;
        assetsValue[j] += assetConvertedValue;
        totalValue += assetConvertedValue;
      }
    }

    this.totalValue = totalValue;
    if (totalValue !== 0) {
      // Update percentages
      for (let i = 0; i < 4; i++) {
        this.instrumentPercentage[i] = Math.floor(instrumentsValue[i] * 100 / totalValue);
      }
      for (let j = 0; j < 5; j++) {
        this.assetPercentage[j] = Math.floor(assetsValue[j] * 100 / totalValue);
      }

      // Update labels
      this.instrumentChartLabels = this.instruments.map((value, index) => {
        return `${value}: ${this.instrumentPercentage[index]}%`;
      })
      this.assetChartLabels = this.assets.map((value, index) => {
        return `${value}: ${this.assetPercentage[index]}%`;
      });

      // Sets charts data
      this.instrumentValue = instrumentsValue;
      this.assetValue = assetsValue;
    } else {
      // Update labels
      this.instrumentChartLabels = this.instruments.map((value, index) => {
        return `${value}: _ _%`;
      })
      this.assetChartLabels = this.assets.map((value, index) => {
        return `${value}: _ _%`;
      });

      // Sets charts data
      this.instrumentValue = [0, 0, 0, 100];
      this.assetValue = [0, 0, 0, 0, 0, 100];
    }

    this.instrumentChartData = [this.instrumentValue];
    this.assetChartData = [this.assetValue];
  }

  private getInstrumentTooltip(tooltipItem, data) {
    const instrument = this.instruments[tooltipItem.index];
    const currency = this.currencyService.getCurrencySymbol();

    if (instrument.indexOf("Placeholder") >= 0) {
      return `${currency} 0`;
    } else {
      return `${instrument}: ${currency} ${this.instrumentValue[tooltipItem.index].toFixed(2)}`;
    }
  }

  private getAssetTooltip(tooltipItem, data) {
    const asset = this.assets[tooltipItem.index];
    const currency = this.currencyService.getCurrencySymbol();

    if (asset.indexOf("Placeholder") >= 0) {
      return `${currency} 0`;
    } else {
      return `${asset}: ${currency} ${this.assetValue[tooltipItem.index].toFixed(2)}`;
    }
  }
}

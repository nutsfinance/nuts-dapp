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
  private instruments = ['Lending', 'Borrowing', 'Swap'];
  private assets = ['ETH', 'USDT', 'USDC', 'NUTS', 'DAI'];

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
      '#BCA795'
    ]
  }];

  public instrumentChartData: MultiDataSet = [
    [350, 450, 100],
  ];
  public instrumentChartOptions = {
    title: {
      display: true,
      text: 'Instruments Balance'
    },
    legend: {
      position: 'bottom',
    },
    aspectRatio: 1.2,
    tooltips: {
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
      '#FAB44B'
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
    },
    aspectRatio: 1.2,
    tooltips: {
      callbacks: {
        label: this.getAssetTooltip.bind(this)
      }
    }
  }

  private userBalanceSubscription: Subscription;
  private currencySubscription: Subscription;

  constructor(private userBalanceService: UserBalanceService, private priceOracleService: PriceOracleService,
    private nutsPlatformService: NutsPlatformService, private currencyService: CurrencyService, private zone: NgZone) { }

  ngOnInit() {
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
    const instrumentsValue = [0, 0, 0];
    const assetsValue = [0, 0, 0, 0, 0];
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
    }

    this.instrumentValue = instrumentsValue;
    this.assetValue = assetsValue;
    this.instrumentChartData = [instrumentsValue];
    this.assetChartData = [assetsValue];
  }

  private getInstrumentTooltip(tooltipItem, data) {
    return `${this.instruments[tooltipItem.index]}: ${this.currencyService.getCurrencySymbol()} ${this.instrumentValue[tooltipItem.index].toFixed(2)}`;
  }

  private getAssetTooltip(tooltipItem, data) {
    console.log(tooltipItem);
    return `${this.assets[tooltipItem.index]}: ${this.currencyService.getCurrencySymbol()} ${this.assetValue[tooltipItem.index].toFixed(2)}`;
  }
}

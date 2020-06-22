import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { MultiDataSet, Label } from 'ng2-charts';

import { environment } from 'src/environments/environment';
import { Subscription } from 'rxjs';
import { PriceOracleService } from 'src/app/common/web3/price-oracle.service';
import { NutsPlatformService } from 'src/app/common/web3/nuts-platform.service';
import { CurrencyService } from 'src/app/common/currency-select/currency.service';
import { TokenService } from 'src/app/common/token/token.service';
import { TokenModel } from 'src/app/common/token/token.model';
import { AccountService, AccountsBalance } from 'src/app/account/account.service';

@Component({
  selector: 'app-dashboard-account-balance',
  templateUrl: './dashboard-account-balance.component.html',
  styleUrls: ['./dashboard-account-balance.component.scss']
})
export class DashboardAccountBalanceComponent implements OnInit, OnDestroy {
  private instruments = ['Lending', 'Borrowing', 'Swap', 'Placeholder'];
  private instrumentChineseLabels = ['借款', '贷款', '互换', 'Placeholder'];
  private tokens: TokenModel[] = [];

  public totalValue = 0;
  public instrumentValue = [0, 0, 0];
  public instrumentPercentage = [0, 0, 0];
  public tokenValue = [0, 0, 0, 0, 0];
  public tokenPercentage = [0, 0, 0, 0, 0];

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
  public tokenChartLabels: Label[];
  public tokenChartColors = [{
    backgroundColor: [
      '#627EEA',
      '#53AE94',
      '#2775CA',
      '#80C14D',
      '#FAB44B',
      '#F1EDEA',
    ]
  }];
  public tokenChartData: MultiDataSet = [
    [10, 20, 30, 40, 50]
  ];
  public tokenChartOptions = {
    title: {
      display: true,
      text: 'Asset Composition',
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

  private accountBalancesSubscription: Subscription;
  private currencySubscription: Subscription;

  constructor(private accountService: AccountService, private priceOracleService: PriceOracleService,
    private nutsPlatformService: NutsPlatformService, public currencyService: CurrencyService,
    private tokenService: TokenService, private zone: NgZone) { }

  ngOnInit() {
    this.tokens = this.tokenService.tokens.filter(token => token.supportsTransaction);
    this.tokenChartLabels = this.tokens.map(token => token.tokenSymbol);
    if (environment.language == 'zh') {
      this.instrumentChartLabels = this.instrumentChineseLabels;
      this.instrumentChartOptions.title.text = '产品资产分布';
      this.tokenChartOptions.title.text = '代币资产分布';  
    }
    
    this.updateAccountBalances();
    this.accountBalancesSubscription = this.accountService.accountsBalanceSubject.subscribe(_ => {
      this.zone.run(() => {
        this.updateAccountBalances();
      });
    });
    this.currencySubscription = this.currencyService.currencyUpdatedSubject.subscribe(_ => {
      this.zone.run(() => {
        this.updateAccountBalances();
      });
    });
  }

  ngOnDestroy() {
    this.accountBalancesSubscription.unsubscribe();
    this.currencySubscription.unsubscribe();
  }

  private async updateAccountBalances() {
    const accountsBalance = this.accountService.accountsBalance;
    const instrumentLabels = environment.language === 'zh' ? this.instrumentChineseLabels : this.instruments;
    const instrumentsValue = [0, 0, 0, 0];
    const tokenValue = [0, 0, 0, 0, 0, 0];
    let totalValue = 0;
    // For each instrument
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 5; j++) {
        const instrument = this.instruments[i].toLowerCase();
        if (!accountsBalance[instrument] || !accountsBalance[instrument][this.tokens[j].tokenAddress]) continue;
        const tokenConvertedValue = await this.priceOracleService.getConvertedCurrencyValue(this.tokens[j],
          accountsBalance[instrument][this.tokens[j].tokenAddress]);

        instrumentsValue[i] += tokenConvertedValue;
        tokenValue[j] += tokenConvertedValue;
        totalValue += tokenConvertedValue;
      }
    }

    this.totalValue = totalValue;
    if (totalValue !== 0) {
      // Update percentages
      for (let i = 0; i < 4; i++) {
        this.instrumentPercentage[i] = Math.floor(instrumentsValue[i] * 100 / totalValue);
      }
      for (let j = 0; j < 5; j++) {
        this.tokenPercentage[j] = Math.floor(tokenValue[j] * 100 / totalValue);
      }

      // Update labels
      this.instrumentChartLabels = instrumentLabels.map((value, index) => {
        return `${value}: ${this.instrumentPercentage[index]}%`;
      })
      this.tokenChartLabels = this.tokens.map((value, index) => {
        return `${value.tokenSymbol}: ${this.tokenPercentage[index]}%`;
      });

      // Sets charts data
      this.instrumentValue = instrumentsValue;
      this.tokenValue = tokenValue;
    } else {
      // Update labels
      this.instrumentChartLabels = instrumentLabels.map((value, index) => {
        return `${value}: _ _%`;
      })
      this.tokenChartLabels = this.tokens.map((value, index) => {
        return `${value.tokenSymbol}: _ _%`;
      });

      // Sets charts data
      this.instrumentValue = [0, 0, 0, 100];
      this.tokenValue = [0, 0, 0, 0, 0, 100];
    }

    this.instrumentChartData = [this.instrumentValue];
    this.tokenChartData = [this.tokenValue];
  }

  private getInstrumentTooltip(tooltipItem, data) {
    const instrument = environment.language == 'zh' ?
      this.instrumentChineseLabels[tooltipItem.index] :
      this.instruments[tooltipItem.index];
    const currency = this.currencyService.getCurrencySymbol();

    if (instrument.indexOf("Placeholder") >= 0) {
      return `${currency} 0`;
    } else {
      return `${instrument}: ${currency} ${this.instrumentValue[tooltipItem.index].toFixed(2)}`;
    }
  }

  private getAssetTooltip(tooltipItem, data) {
    const token = this.tokens[tooltipItem.index];
    const currency = this.currencyService.getCurrencySymbol();

    return `${token.tokenSymbol}: ${currency} ${this.tokenValue[tooltipItem.index].toFixed(2)}`;
  }
}

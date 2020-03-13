import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { MultiDataSet, Label } from 'ng2-charts';
import { UserBalanceService, UserBalance } from 'src/app/common/web3/user-balance.service';
import { Subscription } from 'rxjs';
import { PriceOracleService } from 'src/app/common/web3/price-oracle.service';
import { NutsPlatformService, USD_ADDRESS } from 'src/app/common/web3/nuts-platform.service';

@Component({
  selector: 'app-dashboard-account-balance',
  templateUrl: './dashboard-account-balance.component.html',
  styleUrls: ['./dashboard-account-balance.component.scss']
})
export class DashboardAccountBalanceComponent implements OnInit, OnDestroy {
  private instruments = ['Lending', 'Borrowing', 'Swap'];
  private assets = ['ETH', 'USDT', 'USDC', 'NUTS', 'DAI'];

  // Instrument Chart
  public instrumentChartLabels: Label[] = this.instruments;;
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
    aspectRatio: 1.2
  };

  // Asset Chart
  public assetChartLabels: Label[] = this.assets;
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
    aspectRatio: 1.2
  }

  private userBalanceSubscription: Subscription;

  constructor(private userBalanceService: UserBalanceService, private priceOracleService: PriceOracleService,
    private nutsPlatformService: NutsPlatformService, private zone: NgZone) { }

  ngOnInit() {
    this.userBalanceSubscription = this.userBalanceService.userBalanceSubject.subscribe(userBalance => {
      console.log(userBalance);
      this.zone.run(() => {
        this.updateUserBalance(userBalance);
      });
    });
  }

  ngOnDestroy() {
    this.userBalanceSubscription.unsubscribe();
  }

  private async updateUserBalance(userBalance: UserBalance) {
    const instrumentsValue = [0, 0, 0];
    const assetsValue = [0, 0, 0, 0, 0];
    // For each instrument
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 5; j++) {
        const instrument = this.instruments[i];
        const asset = this.assets[j];
        if (!userBalance[instrument] || !userBalance[instrument][asset])  continue;

        const assetAddress = this.nutsPlatformService.getTokenAddressByName(asset);
        const assetValue = this.nutsPlatformService.getTokenValueByAddress(assetAddress, userBalance[instrument][asset]);
        const assetConvertedValue = await this.priceOracleService.getConvertedValue(USD_ADDRESS, assetAddress, assetValue);

        instrumentsValue[i] += assetConvertedValue;
        assetsValue[j] += assetConvertedValue;
      }
    }

    this.instrumentChartData = [instrumentsValue];
    this.assetChartData = [assetsValue];
  }
}

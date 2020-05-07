import { Component, OnInit, Inject, OnDestroy, NgZone } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { CurrencyService } from '../currency-select/currency.service';
import { AccountBalanceService, AccountBalances } from '../web3/account-balance.service';
import { MultiDataSet, Label } from 'ng2-charts';
import { Subscription } from 'rxjs';
import { USD_ADDRESS, CNY_ADDRESS, NutsPlatformService } from '../web3/nuts-platform.service';
import { PriceOracleService } from '../web3/price-oracle.service';

export interface AccountBalanceData {
    instrument: string,
}

@Component({
    selector: 'app-account-balance-dialog',
    templateUrl: './account-balance-dialog.component.html',
    styleUrls: ['./account-balance-dialog.component.scss']
})
export class AccountBalanceDialog implements OnInit, OnDestroy {
    private assets = ['ETH', 'USDT', 'USDC', 'NUTS', 'DAI', 'Placeholder'];
    private accountBalancesSubscription: Subscription;
    private currencySubscription: Subscription;

    public instrumentName = '';
    public totalValue = 0;
    public assetValue = [0, 0, 0, 0, 0];
    public assetPercentage = [0, 0, 0, 0, 0];
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
            display: false,
            text: 'Assets Balance'
        },
        legend: {
            position: 'bottom',
            padding: 16,
            labels: {
                fontFamily: '"GillSans-light", Helvetica, Arial, serif',
                filter: function (legend, data) {
                    // return true;
                    return legend.text.indexOf("Placeholder") < 0;  // Don't show placeholder legend!
                }
            }
        },
        aspectRatio: 1.0,
        tooltips: {
            enabled: true,
            callbacks: {
                label: this.getAssetTooltip.bind(this)
            }
        }
    }

    constructor(public dialogRef: MatDialogRef<AccountBalanceDialog>, @Inject(MAT_DIALOG_DATA) public data: AccountBalanceData,
        public currencyService: CurrencyService, private accountBalanceService: AccountBalanceService,
        private priceOracleService: PriceOracleService, private nutsPlatformService: NutsPlatformService,
        private zone: NgZone) { }

    ngOnInit() {
        this.instrumentName = this.data.instrument.charAt(0).toUpperCase() + this.data.instrument.substring(1);
        this.updateAccountBalances(this.accountBalanceService.accountBalances);
        this.accountBalancesSubscription = this.accountBalanceService.accountBalancesSubject.subscribe(accountBalances => {
            this.zone.run(() => {
              this.updateAccountBalances(accountBalances);
            });
          });
          this.currencySubscription = this.currencyService.currencyUpdatedSubject.subscribe(_ => {
            this.zone.run(() => {
              this.updateAccountBalances(this.accountBalanceService.accountBalances);
            });
          });
    }

    ngOnDestroy() {
        this.currencySubscription.unsubscribe();
        this.accountBalancesSubscription.unsubscribe();
    }

    private async updateAccountBalances(userBalance: AccountBalances) {
        const assetsValue = [0, 0, 0, 0, 0, 0];
        const targetTokenAddress = this.currencyService.currency === 'USD' ? USD_ADDRESS : CNY_ADDRESS;
        let totalValue = 0;
        // For each assets
        for (let i = 0; i < this.assets.length; i++) {
            if (!userBalance[this.data.instrument] || !userBalance[this.data.instrument][this.assets[i]]) continue;

            const assetAddress = this.nutsPlatformService.getTokenAddressByName(this.assets[i]);
            const assetConvertedValue = await this.priceOracleService.getConvertedValue(targetTokenAddress,
                assetAddress, userBalance[this.data.instrument][this.assets[i]]);

            assetsValue[i] += assetConvertedValue;
            totalValue += assetConvertedValue;
        }

        this.totalValue = totalValue;
        if (totalValue !== 0) {
            // Update percentages
            for (let i = 0; i < this.assets.length; i++) {
                this.assetPercentage[i] = Math.floor(assetsValue[i] * 100 / totalValue);
            }

            // Update labels
            this.assetChartLabels = this.assets.map((value, index) => {
                return `${value}: ${this.assetPercentage[index]}%`;
            });

            // Sets charts data
            this.assetValue = assetsValue;
        } else {
            this.assetChartLabels = this.assets.map((value, index) => {
                return `${value}: _ _%`;
            });

            // Sets charts data
            this.assetValue = [0, 0, 0, 0, 0, 100];
        }

        this.assetChartData = [this.assetValue];
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

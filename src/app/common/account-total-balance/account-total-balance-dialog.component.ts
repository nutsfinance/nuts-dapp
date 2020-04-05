import { Component, OnInit, Inject, OnDestroy, NgZone } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { AccountBalanceService, AccountBalances } from '../web3/account-balance.service';
import { Subscription } from 'rxjs';
import { USD_ADDRESS, NutsPlatformService } from '../web3/nuts-platform.service';
import { PriceOracleService } from '../web3/price-oracle.service';

export interface AccountBalanceData {
    instrument: string,
}

@Component({
    selector: 'app-account-total-balance-dialog',
    templateUrl: './account-total-balance-dialog.component.html',
    styleUrls: ['./account-total-balance-dialog.component.scss']
})
export class AccountTotalBalanceDialog implements OnInit, OnDestroy {
    private accountBalancesSubscription: Subscription;

    public tokens = ['ETH', 'USDT', 'USDC', 'NUTS', 'DAI'];
    public totalValue = 0;
    public tokenValues = {
        'ETH': 0,
        'USDT': 0,
        'USDC': 0,
        'DAI': 0,
        'NUTA': 0,
    };

    constructor(public dialogRef: MatDialogRef<AccountTotalBalanceDialog>, @Inject(MAT_DIALOG_DATA) public data: AccountBalanceData,
        private accountBalanceService: AccountBalanceService, private priceOracleService: PriceOracleService,
        private nutsPlatformService: NutsPlatformService, private zone: NgZone) { }

    ngOnInit() {
        this.updateAccountBalances(this.accountBalanceService.accountBalances);
        this.accountBalancesSubscription = this.accountBalanceService.accountBalancesSubject.subscribe(accountBalances => {
            this.zone.run(() => {
              console.log('Dashboard: Account balances updated', accountBalances);
              this.updateAccountBalances(accountBalances);
            });
          });
    }

    ngOnDestroy() {
        this.accountBalancesSubscription.unsubscribe();
    }

    getTokenPercentage(token: string) {
        return this.totalValue === 0 ? '_ _' : `${(this.tokenValues[token] * 100 / this.totalValue).toFixed(2)}`;
    }

    private async updateAccountBalances(accountBalances: AccountBalances) {
        this.totalValue = 0;
        for (let token of this.tokens) {
            this.tokenValues[token] = 0;
            if (!accountBalances[this.data.instrument] || !accountBalances[this.data.instrument][token]) continue;

            const assetAddress = this.nutsPlatformService.getTokenAddressByName(token);
            const assetConvertedValue = await this.priceOracleService.getConvertedValue(USD_ADDRESS,
                assetAddress, accountBalances[this.data.instrument][token]);

            this.tokenValues[token] = assetConvertedValue;
            this.totalValue += assetConvertedValue;
        }
    }
}

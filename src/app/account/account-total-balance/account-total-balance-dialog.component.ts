import { Component, OnInit, Inject, OnDestroy, NgZone } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { AccountService } from '../account.service';
import { Subscription } from 'rxjs';
import { NutsPlatformService } from '../../common/web3/nuts-platform.service';
import { PriceOracleService } from '../../common/web3/price-oracle.service';
import { TokenService } from 'src/app/common/token/token.service';
import { TokenModel } from 'src/app/common/token/token.model';

export interface AccountBalanceData {
    instrument: string,
}

@Component({
    selector: 'app-account-total-balance-dialog',
    templateUrl: './account-total-balance-dialog.component.html',
    styleUrls: ['./account-total-balance-dialog.component.scss']
})
export class AccountTotalBalanceDialog implements OnInit, OnDestroy {
    private instrumentId: number;
    private accountBalancesSubscription: Subscription;

    public tokens: TokenModel[] = [];
    public totalValue = 0;
    public tokenValues = {};

    constructor(public dialogRef: MatDialogRef<AccountTotalBalanceDialog>, @Inject(MAT_DIALOG_DATA) public data: AccountBalanceData,
        private accountService: AccountService, private priceOracleService: PriceOracleService,
        private nutsPlatformService: NutsPlatformService, private zone: NgZone, private tokenService: TokenService) { }

    ngOnInit() {
        this.instrumentId = this.nutsPlatformService.getInstrumentId(this.data.instrument);
        this.updateAccountBalances();
        this.accountBalancesSubscription = this.accountService.accountsBalanceSubject.subscribe(instrumentId => {
            if (instrumentId !== this.instrumentId) return;
            this.zone.run(() => {
                this.updateAccountBalances();
            });
        });
    }

    ngOnDestroy() {
        this.accountBalancesSubscription.unsubscribe();
    }

    getTokenPercentage(tokenAddress: string) {
        return this.totalValue === 0 ? '_ _' : `${(this.tokenValues[tokenAddress] * 100 / this.totalValue).toFixed(2)}`;
    }

    // As we are calculating the percentage, we could simply convert them into USD!
    private async updateAccountBalances() {
        this.totalValue = 0;
        this.tokens = [];
        this.tokenValues = {};
        const accountBalance = this.accountService.accountsBalance[this.instrumentId];
        for (let token of this.tokenService.tokens) {
            if (!token.supportsTransaction) continue;
            this.tokenValues[token.tokenAddress] = 0;
            this.tokens.push(token);
            if (!accountBalance || !accountBalance[token.tokenAddress]) continue;

            const assetDisplayValue = this.tokenService.getDisplayValue(token.tokenAddress, accountBalance[token.tokenAddress]);
            const assetConvertedValue = await this.priceOracleService.getConvertedValue(token.tokenSymbol, "USD", assetDisplayValue);
            // After converting into USD values, we should not see overflow now!
            this.tokenValues[token.tokenAddress] = assetConvertedValue;
            this.totalValue += assetConvertedValue;
        }
    }
}

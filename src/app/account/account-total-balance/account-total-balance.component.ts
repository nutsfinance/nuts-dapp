import { Component, OnInit, OnDestroy, Input, NgZone } from '@angular/core';
import { AccountService } from '../account.service';
import { CurrencyService } from '../../common/currency-select/currency.service';
import { PriceOracleService } from '../../common/web3/price-oracle.service';
import { USD_ADDRESS, CNY_ADDRESS, NutsPlatformService } from '../../common/web3/nuts-platform.service';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material';
import { AccountTotalBalanceDialog } from './account-total-balance-dialog.component';
import { TokenService } from 'src/app/common/token/token.service';

@Component({
  selector: 'app-account-total-balance',
  templateUrl: './account-total-balance.component.html',
  styleUrls: ['./account-total-balance.component.scss']
})
export class AccountTotalBalanceComponent implements OnInit, OnDestroy {
  @Input() instrument = '';
  public instrumentBalance: Promise<Number>;

  private instrumentId: number;
  private accountBalancesSubscription: Subscription;
  private currencySubscription: Subscription;

  constructor(private accountService: AccountService, public currencyService: CurrencyService,
    private priceOracleService: PriceOracleService, private zone: NgZone, private tokenService: TokenService,
    private nutsPlatformService: NutsPlatformService, private dialog: MatDialog) { }

  ngOnInit() {
    this.instrumentId = this.nutsPlatformService.getInstrumentId(this.instrument);
    this.instrumentBalance = this.getInstrumentAccountBalance();
    this.currencySubscription = this.currencyService.currencyUpdatedSubject.subscribe(_ => {
      this.instrumentBalance = this.getInstrumentAccountBalance();
    });
    this.accountBalancesSubscription = this.accountService.accountsBalanceSubject.subscribe(instrumentId => {
      if (instrumentId !== this.instrumentId) return;
      this.zone.run(() => this.instrumentBalance = this.getInstrumentAccountBalance());
    });
  }

  ngOnDestroy() {
    this.accountBalancesSubscription.unsubscribe();
    this.currencySubscription.unsubscribe();
  }

  openDialog() {
    this.dialog.open(AccountTotalBalanceDialog, {
      width: '60%',
      data: {
        instrument: this.instrument
      },
      position: {
        top: '155px',
        right: '20px'
      }
    });
  }

  private async getInstrumentAccountBalance() {
    const targetToken = this.currencyService.currency;
    const accountBalance = this.accountService.accountsBalance[this.instrumentId];
    let totalValue = 0;
    for (let token of this.tokenService.tokens) {
      if (!token.supportsTransaction) continue;
      if (!accountBalance || !accountBalance[token.tokenAddress]) continue;

      const assetDisplayValue = this.tokenService.getDisplayValue(token.tokenAddress, accountBalance[token.tokenAddress]);
      const convertedValue = await this.priceOracleService.getConvertedValue(token.tokenSymbol, targetToken, assetDisplayValue);
      // After converting into USD values, we should not see overflow now!
      totalValue += convertedValue;
    }

    return totalValue;
  }
}

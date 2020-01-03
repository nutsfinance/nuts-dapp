import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {AccountAddressComponent} from './common/account-address/account-address.component';
import {AccountBalanceComponent} from './common/account-balance/account-balance.component';
import {CurrencySelectSheetComponent} from './common/currency-select/currency-select-sheet.component';
import {CurrencySelectComponent} from './common/currency-select/currency-select.component';
import {InstrumentEscrowBalanceComponent} from './common/instrument-escrow-balance/instrument-escrow-balance.component';
import {NetworkToolbarComponent} from './common/network-toolbar/network-toolbar.component';
import {TokenSelectSheetComponent} from './common/token-select/token-select-sheet.component';
import {TokenSelectComponent} from './common/token-select/token-select.component';
import {DashboardAccountBalanceComponent} from './dashboard/dashboard-account-balance/dashboard-account-balance.component';
import {DashboardMiningBalanceComponent} from './dashboard/dashboard-mining-balance/dashboard-mining-balance.component';
import {DashboardPositionBalanceComponent} from './dashboard/dashboard-position-balance/dashboard-position-balance.component';
import {DashboardComponent} from './dashboard/dashboard.component';
import {BorrowingCreateComponent} from './instrument/borrowing/borrowing-create/borrowing-create.component';
import {BorrowingEngageComponent} from './instrument/borrowing/borrowing-engage/borrowing-engage.component';
import {BorrowingPositionsComponent} from './instrument/borrowing/borrowing-positions/borrowing-positions.component';
import {BorrowingComponent} from './instrument/borrowing/borrowing.component';
import {LendingCreateComponent} from './instrument/lending/lending-create/lending-create.component';
import {LendingEngageComponent} from './instrument/lending/lending-engage/lending-engage.component';
import {LendingPositionsComponent} from './instrument/lending/lending-positions/lending-positions.component';
import {LendingComponent} from './instrument/lending/lending.component';
import {SavingComponent} from './instrument/saving/saving.component';
import {SwapCreateComponent} from './instrument/swap/swap-create/swap-create.component';
import {SwapEngageComponent} from './instrument/swap/swap-engage/swap-engage.component';
import {SwapPositionsComponent} from './instrument/swap/swap-positions/swap-positions.component';
import {SwapComponent} from './instrument/swap/swap.component';
import {WalletDepositComponent} from './instrument/wallet/wallet-deposit/wallet-deposit.component';
import {WalletTransactionComponent} from './instrument/wallet/wallet-transaction/wallet-transaction.component';
import {WalletWithdrawComponent} from './instrument/wallet/wallet-withdraw/wallet-withdraw.component';
import {WalletComponent} from './instrument/wallet/wallet.component';
import {LanguageSelectSheetComponent} from './language-select-sheet.component';
import {MaterialModule} from './material/material-module';


@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    SavingComponent,
    LendingComponent,
    BorrowingComponent,
    SwapComponent,
    AccountAddressComponent,
    WalletComponent,
    WalletDepositComponent,
    WalletWithdrawComponent,
    WalletTransactionComponent,
    LendingCreateComponent,
    LendingEngageComponent,
    LendingPositionsComponent,
    NetworkToolbarComponent,
    CurrencySelectComponent,
    CurrencySelectSheetComponent,
    TokenSelectComponent,
    TokenSelectSheetComponent,
    BorrowingCreateComponent,
    BorrowingEngageComponent,
    BorrowingPositionsComponent,
    SwapCreateComponent,
    SwapEngageComponent,
    SwapPositionsComponent,
    DashboardAccountBalanceComponent,
    DashboardMiningBalanceComponent,
    DashboardPositionBalanceComponent,
    AccountBalanceComponent,
    InstrumentEscrowBalanceComponent,
    LanguageSelectSheetComponent,
  ],
  entryComponents: [
    CurrencySelectSheetComponent,
    TokenSelectSheetComponent,
    LanguageSelectSheetComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MaterialModule,
    BrowserAnimationsModule,
    FormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}

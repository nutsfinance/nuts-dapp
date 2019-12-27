import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {AccountAddressComponent} from './common/account-address/account-address.component';
import {CurrencySelectSheetComponent} from './common/currency-select/currency-select-sheet.component';
import {CurrencySelectComponent} from './common/currency-select/currency-select.component';
import {NetworkToolbarComponent} from './common/network-toolbar/network-toolbar.component';
import {TokenSelectSheetComponent} from './common/token-select/token-select-sheet.component';
import {TokenSelectComponent} from './common/token-select/token-select.component';
import {DashboardComponent} from './dashboard/dashboard.component';
import {BorrowingComponent} from './instrument/borrowing/borrowing.component';
import {LendingCreateComponent} from './instrument/lending/lending-create/lending-create.component';
import {LendingEngageComponent} from './instrument/lending/lending-engage/lending-engage.component';
import {LendingPositionsComponent} from './instrument/lending/lending-positions/lending-positions.component';
import {LendingComponent} from './instrument/lending/lending.component';
import {SavingComponent} from './instrument/saving/saving.component';
import {SwapComponent} from './instrument/swap/swap.component';
import {WalletDepositComponent} from './instrument/wallet/wallet-deposit/wallet-deposit.component';
import {WalletTransactionComponent} from './instrument/wallet/wallet-transaction/wallet-transaction.component';
import {WalletWithdrawComponent} from './instrument/wallet/wallet-withdraw/wallet-withdraw.component';
import {WalletComponent} from './instrument/wallet/wallet.component';
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
  ],
  entryComponents: [
    CurrencySelectSheetComponent,
    TokenSelectSheetComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MaterialModule,
    BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}

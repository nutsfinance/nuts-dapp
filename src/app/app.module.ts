import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ChartsModule } from 'ng2-charts';
import { TimeAgoPipe } from 'time-ago-pipe';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent, NotificationSnackBar } from './app.component';
import { AccountAddressComponent } from './common/account-address/account-address.component';
import { AccountBalanceComponent } from './common/account-balance/account-balance.component';
import { BlockTimestampComponent } from './common/block-timestamp/block-timestamp.component';
import { CurrencySelectSheetComponent } from './common/currency-select/currency-select-sheet.component';
import { CurrencySelectComponent } from './common/currency-select/currency-select.component';
import { InstrumentEscrowBalanceComponent } from './common/instrument-escrow-balance/instrument-escrow-balance.component';
import { NetworkToolbarComponent } from './common/network-toolbar/network-toolbar.component';
import { TokenSelectSheetComponent } from './common/token-select/token-select-sheet.component';
import { TokenSelectComponent } from './common/token-select/token-select.component';
import { BorrowingCreateComponent } from './instrument/borrowing/borrowing-create/borrowing-create.component';
import { BorrowingEngageComponent } from './instrument/borrowing/borrowing-engage/borrowing-engage.component';
import { BorrowingPositionsComponent } from './instrument/borrowing/borrowing-positions/borrowing-positions.component';
import { BorrowingComponent } from './instrument/borrowing/borrowing.component';
import { DashboardAccountBalanceComponent } from './instrument/dashboard/dashboard-account-balance/dashboard-account-balance.component';
import { DashboardMiningBalanceComponent } from './instrument/dashboard/dashboard-mining-balance/dashboard-mining-balance.component';
import { DashboardPositionBalanceComponent } from './instrument/dashboard/dashboard-position-balance/dashboard-position-balance.component';
import { DashboardComponent } from './instrument/dashboard/dashboard.component';
import { InstrumentComponent, LanguageSelectSheet } from './instrument/instrument.component';
import { LendingCardComponent } from './instrument/lending/lending-card/lending-card.component';
import { LendingCreateComponent } from './instrument/lending/lending-create/lending-create.component';
import { LendingDetailComponent } from './instrument/lending/lending-detail/lending-detail.component';
import { LendingEngageComponent } from './instrument/lending/lending-engage/lending-engage.component';
import { LendingPositionsComponent } from './instrument/lending/lending-positions/lending-positions.component';
import { LendingComponent } from './instrument/lending/lending.component';
import { SavingComponent } from './instrument/saving/saving.component';
import { SwapCreateComponent } from './instrument/swap/swap-create/swap-create.component';
import { SwapEngageComponent } from './instrument/swap/swap-engage/swap-engage.component';
import { SwapPositionsComponent } from './instrument/swap/swap-positions/swap-positions.component';
import { SwapComponent } from './instrument/swap/swap.component';
import { WalletDepositComponent } from './wallet/wallet-deposit/wallet-deposit.component';
import { WalletTransactionComponent } from './wallet/wallet-transaction/wallet-transaction.component';
import { WalletWithdrawComponent } from './wallet/wallet-withdraw/wallet-withdraw.component';
import { WalletComponent } from './wallet/wallet.component';
import { MaterialModule } from './material/material-module';
import { NotificationDialog } from './notification/notification-dialog/notification-dialog.component';
import { NotificationRowComponent } from './notification/notification-row/notification-row.component';
import { NotificationComponent } from './notification/notification.component';
import { TransactionInitiatedDialog } from './common/transaction-initiated-dialog/transaction-initiated-dialog.component';

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
    LanguageSelectSheet,
    NotificationSnackBar,
    BlockTimestampComponent,
    LendingDetailComponent,
    LendingCardComponent,
    NotificationComponent,
    NotificationRowComponent,
    InstrumentComponent,
    TimeAgoPipe,
    NotificationDialog,
    TransactionInitiatedDialog,
  ],
  entryComponents: [
    CurrencySelectSheetComponent,
    TokenSelectSheetComponent,
    LanguageSelectSheet,
    NotificationSnackBar,
    NotificationDialog,
    TransactionInitiatedDialog,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MaterialModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    ChartsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

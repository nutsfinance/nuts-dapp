import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ChartsModule } from 'ng2-charts';
import { TimeAgoPipe } from 'time-ago-pipe';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent, NotificationSnackBar, IncorrectNetworkDialog, DisconnectedDialog } from './app.component';
import { WalletAddressComponent } from './common/wallet-address/wallet-address.component';
import { WalletBalanceComponent } from './common/wallet-balance/wallet-balance.component';
import { BlockTimestampComponent } from './common/block-timestamp/block-timestamp.component';
import { CurrencySelectSheetComponent } from './common/currency-select/currency-select-sheet.component';
import { CurrencySelectComponent } from './common/currency-select/currency-select.component';
import { AccountBalanceComponent } from './common/account-balance/account-balance.component';
import { NetworkToolbarComponent } from './common/network-toolbar/network-toolbar.component';
import { TokenSelectSheetComponent } from './common/token-select/token-select-sheet.component';
import { TokenSelectComponent } from './common/token-select/token-select.component';
import { BorrowingCreateComponent } from './instrument/borrowing/borrowing-create/borrowing-create.component';
import { BorrowingEngageComponent } from './instrument/borrowing/borrowing-engage/borrowing-engage.component';
import { BorrowingPositionsComponent } from './instrument/borrowing/borrowing-positions/borrowing-positions.component';
import { BorrowingComponent } from './instrument/borrowing/borrowing.component';
import { DashboardAccountBalanceComponent } from './instrument/dashboard/dashboard-account-balance/dashboard-account-balance.component';
import { DashboardPositionBalanceComponent } from './instrument/dashboard/dashboard-position-balance/dashboard-position-balance.component';
import { DashboardComponent } from './instrument/dashboard/dashboard.component';
import { InstrumentComponent, LanguageSelectSheet } from './instrument/instrument.component';
import { LendingCardComponent } from './instrument/lending/lending-card/lending-card.component';
import { LendingCreateComponent } from './instrument/lending/lending-create/lending-create.component';
import { LendingDetailComponent } from './instrument/lending/lending-detail/lending-detail.component';
import { LendingEngageComponent } from './instrument/lending/lending-engage/lending-engage.component';
import { LendingPositionsComponent } from './instrument/lending/lending-positions/lending-positions.component';
import { LendingComponent } from './instrument/lending/lending.component';
import { SwapCreateComponent } from './instrument/swap/swap-create/swap-create.component';
import { SwapEngageComponent } from './instrument/swap/swap-engage/swap-engage.component';
import { SwapPositionsComponent } from './instrument/swap/swap-positions/swap-positions.component';
import { SwapComponent } from './instrument/swap/swap.component';
import { AccountDepositComponent } from './account/account-deposit/account-deposit.component';
import { AccountTransactionComponent } from './account/account-transaction/account-transaction.component';
import { AccountWithdrawComponent } from './account/account-withdraw/account-withdraw.component';
import { AccountComponent } from './account/account.component';
import { MaterialModule } from './material/material-module';
import { NotificationDialog } from './notification/notification-dialog/notification-dialog.component';
import { NotificationRowComponent } from './notification/notification-row/notification-row.component';
import { NotificationComponent } from './notification/notification.component';
import { TransactionInitiatedDialog } from './common/transaction-initiated-dialog/transaction-initiated-dialog.component';
import { CanActivateInstrument } from './instrument/instrument-routing-guard.service';
import { AccountTotalBalanceComponent } from './common/account-total-balance/account-total-balance.component';
import { AccountBalanceDialog } from './common/account-total-balance/account-balance-doalog.component';
import { TokenValuePipe } from './common/web3/token-value.pipe';
import { BorrowingCardComponent } from './instrument/borrowing/borrowing-card/borrowing-card.component';
import { BorrowingDetailComponent } from './instrument/borrowing/borrowing-detail/borrowing-detail.component';
import { SwapCardComponent } from './instrument/swap/swap-card/swap-card.component';
import { SwapDetailComponent } from './instrument/swap/swap-detail/swap-detail.component';
import { TokenImageComponent } from './common/token-image/token-image.component';


@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    LendingComponent,
    BorrowingComponent,
    SwapComponent,
    WalletAddressComponent,
    AccountComponent,
    AccountDepositComponent,
    AccountWithdrawComponent,
    AccountTransactionComponent,
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
    DashboardPositionBalanceComponent,
    WalletBalanceComponent,
    AccountBalanceComponent,
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
    AccountTotalBalanceComponent,
    AccountBalanceDialog,
    IncorrectNetworkDialog,
    DisconnectedDialog,
    TokenValuePipe,
    BorrowingCardComponent,
    BorrowingDetailComponent,
    SwapCardComponent,
    SwapDetailComponent,
    TokenImageComponent,
  ],
  entryComponents: [
    CurrencySelectSheetComponent,
    TokenSelectSheetComponent,
    LanguageSelectSheet,
    NotificationSnackBar,
    NotificationDialog,
    TransactionInitiatedDialog,
    IncorrectNetworkDialog,
    DisconnectedDialog,
    AccountBalanceDialog,
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
  providers: [CanActivateInstrument],
  bootstrap: [AppComponent]
})
export class AppModule { }

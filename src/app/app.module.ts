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
import { IssuanceNotificationComponent } from './notification/issuance-notification/issuance-notification.component';
import { CanActivateInstrument } from './instrument/instrument-routing-guard.service';
import { InstrumentBalanceComponent } from './common/instrument-balance/instrument-balance.component';

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
    IssuanceNotificationComponent,
    InstrumentBalanceComponent,
    IncorrectNetworkDialog,
    DisconnectedDialog,
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

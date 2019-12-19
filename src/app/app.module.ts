import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {MaterialModule} from './material/material-module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SavingComponent } from './instrument/saving/saving.component';
import { LendingComponent } from './instrument/lending/lending.component';
import { BorrowingComponent } from './instrument/borrowing/borrowing.component';
import { SwapComponent } from './instrument/swap/swap.component';
import { AccountAddressComponent } from './common/account-address/account-address.component';
import { WalletComponent } from './instrument/wallet/wallet.component';


@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    SavingComponent,
    LendingComponent,
    BorrowingComponent,
    SwapComponent,
    AccountAddressComponent,
    WalletComponent
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

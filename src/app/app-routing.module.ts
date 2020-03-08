import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './instrument/dashboard/dashboard.component';
import { BorrowingComponent } from './instrument/borrowing/borrowing.component';
import { LendingComponent } from './instrument/lending/lending.component';
import { SavingComponent } from './instrument/saving/saving.component';
import { SwapComponent } from './instrument/swap/swap.component';
import { WalletComponent } from './wallet/wallet.component';
import { LendingCreateComponent } from './instrument/lending/lending-create/lending-create.component';
import { LendingPositionsComponent } from './instrument/lending/lending-positions/lending-positions.component';
import { BorrowingCreateComponent } from './instrument/borrowing/borrowing-create/borrowing-create.component';
import { LendingEngageComponent } from './instrument/lending/lending-engage/lending-engage.component';
import { BorrowingEngageComponent } from './instrument/borrowing/borrowing-engage/borrowing-engage.component';
import { BorrowingPositionsComponent } from './instrument/borrowing/borrowing-positions/borrowing-positions.component';
import { SwapCreateComponent } from './instrument/swap/swap-create/swap-create.component';
import { SwapEngageComponent } from './instrument/swap/swap-engage/swap-engage.component';
import { SwapPositionsComponent } from './instrument/swap/swap-positions/swap-positions.component';
import { LendingDetailComponent } from './instrument/lending/lending-detail/lending-detail.component';
import { InstrumentComponent } from './instrument/instrument.component';
import { NotificationComponent } from './notification/notification.component';


const routes: Routes = [
  { path: '', redirectTo: 'instrument', pathMatch: 'full' },
  { path: 'notification', component: NotificationComponent },
  {
    path: 'instrument',
    component: InstrumentComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent},
      {
        path: 'saving', component: SavingComponent, children: [
          { path: '', redirectTo: 'wallet', pathMatch: 'full' },
          { path: 'wallet', component: WalletComponent, data: { instrument: 'saving' } }
        ]
      },
      {
        path: 'lending', component: LendingComponent, children: [
          { path: '', redirectTo: 'wallet', pathMatch: 'full' },
          { path: 'wallet', component: WalletComponent, data: { instrument: 'lending' } },
          { path: 'create', component: LendingCreateComponent },
          { path: 'engage', component: LendingEngageComponent },
          { path: 'positions', component: LendingPositionsComponent },
          { path: ':id', component: LendingDetailComponent }
        ]
      },
      {
        path: 'borrowing', component: BorrowingComponent, children: [
          { path: '', redirectTo: 'wallet', pathMatch: 'full' },
          { path: 'wallet', component: WalletComponent, data: { instrument: 'borrowing' } },
          { path: 'create', component: BorrowingCreateComponent },
          { path: 'engage', component: BorrowingEngageComponent },
          { path: 'positions', component: BorrowingPositionsComponent }
        ]
      },
      {
        path: 'swap', component: SwapComponent, children: [
          { path: '', redirectTo: 'wallet', pathMatch: 'full' },
          { path: 'wallet', component: WalletComponent, data: { instrument: 'swap' } },
          { path: 'create', component: SwapCreateComponent },
          { path: 'engage', component: SwapEngageComponent },
          { path: 'positions', component: SwapPositionsComponent }
        ]
      },
    ]
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

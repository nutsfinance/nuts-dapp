import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './instrument/dashboard/dashboard.component';
import { BorrowingComponent } from './instrument/borrowing/borrowing.component';
import { LendingComponent } from './instrument/lending/lending.component';
import { SwapComponent } from './instrument/swap/swap.component';
import { AccountComponent } from './account/account.component';
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
import { CanActivateInstrument } from './instrument/instrument-routing-guard.service';
import { BorrowingDetailComponent } from './instrument/borrowing/borrowing-detail/borrowing-detail.component';
import { SwapDetailComponent } from './instrument/swap/swap-detail/swap-detail.component';


const routes: Routes = [
  { path: ':lang', redirectTo: ':lang/instrument', pathMatch: 'full' },
  { path: ':lang/notification', component: NotificationComponent },
  {
    path: ':lang/instrument',
    component: InstrumentComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent},
      {
        path: 'lending', component: LendingComponent, canActivateChild: [ CanActivateInstrument ],
        children: [
          { path: '', redirectTo: 'account', pathMatch: 'full' },
          { path: 'account', component: AccountComponent, data: { instrument: 'lending' } },
          { path: 'create', component: LendingCreateComponent },
          { path: 'engage', component: LendingEngageComponent },
          { path: 'positions', component: LendingPositionsComponent },
          { path: 'positions/:id', component: LendingDetailComponent }
        ]
      },
      {
        path: 'borrowing', component: BorrowingComponent, canActivateChild: [ CanActivateInstrument ],
        children: [
          { path: '', redirectTo: 'account', pathMatch: 'full' },
          { path: 'account', component: AccountComponent, data: { instrument: 'borrowing' } },
          { path: 'create', component: BorrowingCreateComponent },
          { path: 'engage', component: BorrowingEngageComponent },
          { path: 'positions', component: BorrowingPositionsComponent },
          { path: 'positions/:id', component: BorrowingDetailComponent }
        ]
      },
      {
        path: 'swap', component: SwapComponent, canActivateChild: [ CanActivateInstrument ],
        children: [
          { path: '', redirectTo: 'account', pathMatch: 'full' },
          { path: 'account', component: AccountComponent, data: { instrument: 'swap' } },
          { path: 'create', component: SwapCreateComponent },
          { path: 'engage', component: SwapEngageComponent },
          { path: 'positions', component: SwapPositionsComponent },
          { path: 'positions/:id', component: SwapDetailComponent }
        ]
      },
    ]
  },
  { path: '**', redirectTo: 'en/instrument' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {DashboardComponent} from './dashboard/dashboard.component';
import {BorrowingComponent} from './instrument/borrowing/borrowing.component';
import {LendingComponent} from './instrument/lending/lending.component';
import {SavingComponent} from './instrument/saving/saving.component';
import {SwapComponent} from './instrument/swap/swap.component';




const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
  },
  {
    path: 'instrument',
    children: [
      {
        path: 'saving',
        component: SavingComponent,
      },
      {
        path: 'lending',
        component: LendingComponent,
      },
      {
        path: 'borrowing',
        component: BorrowingComponent,
      },
      {
        path: 'swap',
        component: SwapComponent,
      },
    ]
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}

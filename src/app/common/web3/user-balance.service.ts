import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';
import { NutsPlatformService } from './nuts-platform.service';
import { Subject, BehaviorSubject, of } from 'rxjs';

export interface UserBalance {
  Saving?: InstrumentBalance,
  Lending?: InstrumentBalance,
  Borrowing?: InstrumentBalance,
  Swap?: InstrumentBalance,
}

export interface InstrumentBalance {
  ETH?: number,
  USDT?: number,
  USDC?: number,
  NUTS?: number,
  DAI?: number
}

@Injectable({
  providedIn: 'root'
})
export class UserBalanceService {
  public userBalance: UserBalance = {};
  public userBalanceSubject: Subject<UserBalance> = new BehaviorSubject({});

  constructor(private nutsPlatformService: NutsPlatformService, private http: HttpClient) {
    this.getUserBalance();
    this.nutsPlatformService.currentNetworkSubject.subscribe(_ => {
      this.getUserBalance();
    });
    this.nutsPlatformService.currentAccountSubject.subscribe(_ => {
      this.getUserBalance();
    });
  }

  getUserBalance() {
    const currentAddress = this.nutsPlatformService.currentAccount;
    const currentNetwork = this.nutsPlatformService.currentNetwork;
    if (!currentAddress || (currentNetwork !== 1 && currentNetwork !== 4)) {
      console.log('Current address', currentAddress, 'Current network', currentNetwork);
      return of([]);
    }
    this.http.get<UserBalance>(`${environment.notificationServer}/query/balance`, {params: {user: currentAddress}}).subscribe(userBalance => {
      this.userBalance = userBalance;
      this.userBalanceSubject.next(userBalance);
    });
  }
}

import { Injectable } from '@angular/core';

import { NutsPlatformService } from './nuts-platform.service';
import { Subject, BehaviorSubject } from 'rxjs';

const InstrumentEscrow = require('./abi/InstrumentEscrowInterface.json');

export interface UserBalance {
  lending?: InstrumentBalance,
  borrowing?: InstrumentBalance,
  swap?: InstrumentBalance,
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

  constructor(private nutsPlatformService: NutsPlatformService) {
    // We don't initialize the user balance until the platform is initialized!
    this.nutsPlatformService.platformInitializedSubject.subscribe(initialized => {
      console.log('User balance initialized', initialized);
      if (initialized) {
        this.getUserBalanceOnChain();
        this.nutsPlatformService.currentNetworkSubject.subscribe(_ => {
          this.getUserBalanceOnChain();
        });
        this.nutsPlatformService.currentAccountSubject.subscribe(_ => {
          this.getUserBalanceOnChain();
        });
      }
    });
  }

  // getUserBalance() {
  //   const currentAddress = this.nutsPlatformService.currentAccount;
  //   const currentNetwork = this.nutsPlatformService.currentNetwork;
  //   if (!currentAddress || (currentNetwork !== 1 && currentNetwork !== 4)) {
  //     console.log('Current address', currentAddress, 'Current network', currentNetwork);
  //     return of([]);
  //   }
  //   this.http.get<UserBalance>(`${environment.notificationServer}/query/balance`, {params: {user: currentAddress}}).subscribe(userBalance => {
  //     this.userBalance = userBalance;
  //     this.userBalanceSubject.next(userBalance);
  //   });
  // }

  async getUserBalanceOnChain() {
    const currentAddress = this.nutsPlatformService.currentAccount;
    const currentNetwork = this.nutsPlatformService.currentNetwork;
    console.log('User balance: Current address', currentAddress, 'Current network', currentNetwork);
    if (!currentAddress || (currentNetwork !== 1 && currentNetwork !== 4)) {
      this.userBalance = {};
      this.userBalanceSubject.next({});
      return;
    }

    const batchedRequests = [];
    const instruments = ['lending', 'borrowing', 'swap'];
    const assets = ['ETH', 'USDT', 'USDC', 'NUTS', 'DAI'];

    for (let instrument of instruments) {
      const instrumentEscrowAddres = this.nutsPlatformService.contractAddresses[currentNetwork].platform[instrument].instrumentEscrow;
      const instrumentEscrowContract = new this.nutsPlatformService.web3.eth.Contract(InstrumentEscrow, instrumentEscrowAddres);
      for (let asset of assets) {
        const assetAddress = this.nutsPlatformService.getTokenAddressByName(asset);
        batchedRequests.push(instrumentEscrowContract.methods.getTokenBalance(currentAddress, assetAddress).call);
      }
    }
    const instrumentBalances = await this.nutsPlatformService.makeBatchRequest(batchedRequests);
    console.log(instrumentBalances);
    this.userBalance = {};
    let index = 0;
    for (let instrument of instruments) {
      for (let asset of assets) {
        if (!this.userBalance[instrument]) {
          this.userBalance[instrument] = {};
        }
        this.userBalance[instrument][asset] = instrumentBalances[index++];
      }
    }

    this.userBalanceSubject.next(this.userBalance);
  }
}

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
    if (!this.nutsPlatformService.isFullyLoaded()) {
      console.log('Either network or account is not loaded.');
      return;
    }

    const instruments = ['lending', 'borrowing', 'swap'];
    const assets = ['ETH', 'USDT', 'USDC', 'NUTS', 'DAI'];
    this.userBalance = {};

    for (let instrument of instruments) {
      const instrumentEscrowAddres = this.nutsPlatformService.contractAddresses[currentNetwork].platform[instrument].instrumentEscrow;
      const instrumentEscrowContract = new this.nutsPlatformService.web3.eth.Contract(InstrumentEscrow, instrumentEscrowAddres);
      this.userBalance[instrument] = {};
      
      for (let asset of assets) {
        const assetAddress = this.nutsPlatformService.getTokenAddressByName(asset);
        const balance = await instrumentEscrowContract.methods.getTokenBalance(currentAddress, assetAddress).call();
        // console.log('Balance for instrument', instrument, 'asset', asset, balance);
        this.userBalance[instrument][asset] = balance;
      }
    }

    this.userBalanceSubject.next(this.userBalance);
  }

  /**
   * Update the instrument balance on the asset specified
   */
  async updateInstrumentBalance(instrument: string, asset: string) {
    console.log('Update balance for instrument', instrument, 'asset', asset);
    const currentAddress = this.nutsPlatformService.currentAccount;
    const currentNetwork = this.nutsPlatformService.currentNetwork;

    const instrumentEscrowAddres = this.nutsPlatformService.contractAddresses[currentNetwork].platform[instrument].instrumentEscrow;
    const instrumentEscrowContract = new this.nutsPlatformService.web3.eth.Contract(InstrumentEscrow, instrumentEscrowAddres);
    const assetAddress = this.nutsPlatformService.getTokenAddressByName(asset);
    const balance = await instrumentEscrowContract.methods.getTokenBalance(currentAddress, assetAddress).call();

    if (this.userBalance[instrument][asset] !== balance) {
      this.userBalance[instrument][asset] = balance;
      this.userBalanceSubject.next(this.userBalance);
    }
  }
}

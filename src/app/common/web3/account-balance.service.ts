import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NutsPlatformService } from './nuts-platform.service';
import { Subject } from 'rxjs';

const InstrumentEscrow = require('./abi/InstrumentEscrowInterface.json');

export interface AccountBalances {
  lending?: AccountBalance,
  borrowing?: AccountBalance,
  swap?: AccountBalance,
}

export interface AccountBalance {
  ETH?: number,
  USDT?: number,
  USDC?: number,
  NUTS?: number,
  DAI?: number
}

@Injectable({
  providedIn: 'root'
})
export class AccountBalanceService {
  public accountBalances: AccountBalances = {};
  public accountBalancesSubject: Subject<AccountBalances> = new Subject();

  constructor(private nutsPlatformService: NutsPlatformService, private http: HttpClient) {
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
        // Reloads account every 60s.
        setTimeout(this.getUserBalanceOnChain.bind(this), 60000);
      }
    });
  }

  getUserBalanceFromBackend() {
    const currentAddress = this.nutsPlatformService.currentAccount;
    const currentNetwork = this.nutsPlatformService.currentNetwork;
    console.log('User balance: Current address', currentAddress, 'Current network', currentNetwork);
    if (!this.nutsPlatformService.isFullyLoaded()) {
      console.log('Either network or account is not loaded.');
      return;
    }
    this.http.get<AccountBalances>(`${this.nutsPlatformService.getApiServerHost()}/query/balance`, {params: {user: currentAddress}}).subscribe(accountBalances => {
      console.log('Account balance from backend', accountBalances);
      this.accountBalances = accountBalances;
      this.accountBalancesSubject.next(accountBalances);
    });
  }

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
    this.accountBalances = {};

    for (let instrument of instruments) {
      const instrumentEscrowAddres = this.nutsPlatformService.contractAddresses[currentNetwork].platform[instrument].instrumentEscrow;
      const instrumentEscrowContract = new this.nutsPlatformService.web3.eth.Contract(InstrumentEscrow, instrumentEscrowAddres);
      this.accountBalances[instrument] = {};

      for (let asset of assets) {
        const assetAddress = this.nutsPlatformService.getTokenAddressByName(asset);
        const balance = Number(await instrumentEscrowContract.methods.getTokenBalance(currentAddress, assetAddress).call());
        // console.log('Balance for instrument', instrument, 'asset', asset, balance);
        this.accountBalances[instrument][asset] = balance;
      }
    }

    this.accountBalancesSubject.next(this.accountBalances);
  }

  /**
   * Update the account balance on the instrument and asset specified
   */
  async updateAssetBalance(instrument: string, asset: string) {
    console.log('Update balance for instrument', instrument, 'asset', asset);
    const currentAddress = this.nutsPlatformService.currentAccount;
    const currentNetwork = this.nutsPlatformService.currentNetwork;

    const instrumentEscrowAddres = this.nutsPlatformService.contractAddresses[currentNetwork].platform[instrument].instrumentEscrow;
    const instrumentEscrowContract = new this.nutsPlatformService.web3.eth.Contract(InstrumentEscrow, instrumentEscrowAddres);
    const assetAddress = this.nutsPlatformService.getTokenAddressByName(asset);
    const balance = Number(await instrumentEscrowContract.methods.getTokenBalance(currentAddress, assetAddress).call());
    console.log('Current balance', this.accountBalances[instrument][asset], 'new balance', balance);

    if (this.accountBalances[instrument][asset] !== balance) {
      this.accountBalances[instrument][asset] = balance;
      this.accountBalancesSubject.next(this.accountBalances);
    }
  }

  /**
   * Update the account balance on the instrument specified
   */
  async updateAccountBalance(instrument: string) {
    const currentAddress = this.nutsPlatformService.currentAccount;
    const currentNetwork = this.nutsPlatformService.currentNetwork;
    console.log('User balance: Current address', currentAddress, 'Current network', currentNetwork);
    if (!this.nutsPlatformService.isFullyLoaded()) {
      console.log('Either network or account is not loaded.');
      return;
    }

    const assets = ['ETH', 'USDT', 'USDC', 'NUTS', 'DAI'];
    this.accountBalances = {};

    const instrumentEscrowAddres = this.nutsPlatformService.contractAddresses[currentNetwork].platform[instrument].instrumentEscrow;
    const instrumentEscrowContract = new this.nutsPlatformService.web3.eth.Contract(InstrumentEscrow, instrumentEscrowAddres);
    this.accountBalances[instrument] = {};

    for (let asset of assets) {
      const assetAddress = this.nutsPlatformService.getTokenAddressByName(asset);
      const balance = Number(await instrumentEscrowContract.methods.getTokenBalance(currentAddress, assetAddress).call());
      // console.log('Balance for instrument', instrument, 'asset', asset, balance);
      this.accountBalances[instrument][asset] = balance;
    }

    this.accountBalancesSubject.next(this.accountBalances);
  }
}

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

const Web3 = require('web3');

declare let require: any;
declare let window: any;

@Injectable({
  providedIn: 'root'
})
export class NutsPlatformService {
  private web3: any;

  public currentAccount: string;
  public currentAccountSubject = new Subject<string>();
  public currentNetwork: number;
  public currentNetworkSubject = new Subject<number>();

  constructor() {
    console.log('NutsPlatformServcie constructor');
    window.addEventListener('load', () => {
      this.bootstrapWeb3();
    });
  }

  public async getEthBalance(): Promise<string> {
    if (!this.web3 || !this.currentAccount) {
      console.log('Not set', this.web3, this.currentAccount);
      return Promise.resolve('0');
    }
    return this.web3.eth.getBalance(this.currentAccount);
  }

  private async bootstrapWeb3() {
    console.log('Bootstrap web3');
    const { ethereum } = window;
    if (!ethereum || !ethereum.isMetaMask) {
      throw new Error('Please install MetaMask.')
    }
    this.web3 = new Web3(ethereum);
    ethereum.on('accountsChanged', (accounts) => this.handleAccountChanged(accounts));
    ethereum.on('networkChanged', (network) => this.handleNetworkChanged(network));
    this.handleAccountChanged([ethereum.selectedAddress]);
    this.handleNetworkChanged(Number(ethereum.chainId));

    // ethereum.send('eth_requestAccounts')
    //   .then((accounts) => {
    //     this.handleAccountChanged(accounts.result);
    //   })
    //   .catch(error => {
    //     console.error(error);
    //   });
  }

  private handleAccountChanged(accounts) {
    console.log('Account changed', accounts);
    if (accounts && accounts.length > 0 && accounts[0] != this.currentAccount) {
      this.currentAccount = accounts[0];
      this.currentAccountSubject.next(accounts[0]);
    }
  }

  private handleNetworkChanged(network) {
    console.log('Network changed', network);
    if (network && network != this.currentNetwork) {
      this.currentNetwork = network;
      this.currentNetworkSubject.next(network);
      console.log('Updated');
    }
  }
}

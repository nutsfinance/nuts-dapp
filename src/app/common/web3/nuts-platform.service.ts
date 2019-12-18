import {Injectable} from '@angular/core';

declare let window: any;

@Injectable({
  providedIn: 'root'
})
export class NutsPlatformService {

  constructor() {
    console.log('NutsPlatformServcie constructor');
    window.addEventListener('load', () => {
      this.bootstrapWeb3();
    });
  }

  private async bootstrapWeb3() {
    console.log('Bootstrap web3');
    const {ethereum} = window;
    if (!ethereum || !ethereum.isMetaMask) {
      throw new Error('Please install MetaMask.')
    }
    ethereum.on('accountsChanged', this.handleAccountChanged);
    ethereum.on('networkChanged', this.handleNetworkChanged);

    ethereum.send('eth_requestAccounts')
      .then(this.handleNetworkChanged)
      .catch(error => {
        console.error(error);
      })
  }

  private handleAccountChanged(accounts) {
    console.log('Account changed', accounts);
  }

  private handleNetworkChanged(network) {
    console.log('Network changed', network);
  }
}

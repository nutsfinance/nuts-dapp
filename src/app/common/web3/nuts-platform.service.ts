import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

const Web3 = require('web3');
const ERC20 = require('./abi/IERC20.json');
const InstrumentEscrow = require('./abi/InstrumentEscrowInterface.json');
const InstrumentManager = require('./abi/InstrumentManagerInterface.json');

export const FSP_NAME = 'accoconut.dapp.finance';
export const ETH_ADDRESS = '0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF';
export const USD_ADDRESS = '0x3EfC5E3c4CFFc638E9C506bb0F040EA0d8d3D094';
export const CNY_ADDRESS = '0x2D5254e5905c6671b1804eac23Ba3F1C8773Ee46';

export const LENDING_NAME = "lending";
export const BORROWING_NAME = 'borrowing';
export const SWAP_NAME = 'swap';
export const NUTS_PLATFORM_ADDRESSES = {
  1: {
    instrumentRegistry: '',
    priceOracle: '',
    instruments: {
      ipoSubscription: {
        instrumentId: 1,
        instrumentManager: '',
        instrumentEscrow: '',
      }
    }
  },
  42: {
    instrumentRegistry: '0xB2175E8B1432Be81a2F52835eC7ea6b740db6bE7',
    priceOracle: '0xF697B149FAa6e5cfed7f1EbC1ECDa183A9942750',
    instruments: {
      lending: {
        instrumentManager: '0x627871D7fE1F0b085f70618b44396C27107a4c20',
        instrumentEscrow: '0xc234D8d05508ef00961258061EB4392FEeEA6c16',
        instrumentId: 1
      },
      borrowing: {
        instrumentManager: '0x176B8FE7694e90ec7aE45fB11273428434DAFC7d',
        instrumentEscrow: '0x231284AB8500C026CEe01c224f3fA20f66D28D0B',
        instrumentId: 2
      }, swap:
      {
        instrumentManager: '0xAd499f619BE1C3e5628840A74080b69ba015eAd5',
        instrumentEscrow: '0x4B22d4181Ea2D526C479d3D10571BA22F1B6dD2f',
        instrumentId: 3
      },
      weth: '0x8018b912dddfc0cf7bc33ae72ccb326541518c17',
    }
  }
};

declare let require: any;
declare let window: any;

@Injectable({
  providedIn: 'root'
})
export class NutsPlatformService {

  public web3: any;
  public currentAccount: string;
  public currentAccountSubject = new Subject<string>();
  public currentNetwork: string;
  public currentNetworkSubject = new Subject<string>();
  public platformInitializedSubject = new Subject<boolean>();

  public transactionSentSubject = new Subject<string>();
  public transactionConfirmedSubject = new Subject<string>();

  // Caching the block number -> timestamp mapping
  private blockTimestampCache = {};

  constructor() {
    // window.addEventListener('load', () => {
    //   this.bootstrapWeb3();
    // });
    this.bootstrapWeb3();
  }

  public isAddressValid(): boolean {
    return !!this.currentAccount;
  }

  public isNetworkValid(): boolean {
    return this.currentNetwork === '1' || this.currentNetwork === '4' || this.currentNetwork === '42';
  }

  public getApiServerHost(): string {
    switch (this.currentNetwork) {
      case '1':
        return 'https://main-api.dapp.finance';
      case '4':
        return 'https://rinkeby-api.dapp.finance';
      case '42':
        return 'https://kovan-api.dapp.finance';
      default:
        return '';
    }
  }

  public isFullyLoaded(): boolean {
    return this.isAddressValid() && this.isNetworkValid();
  }

  public getWETH(): string {
    if (!NUTS_PLATFORM_ADDRESSES[this.currentNetwork]) return '';
    return NUTS_PLATFORM_ADDRESSES[this.currentNetwork].weth;
  }

  public getInstrumentId(instrument: string): number {
    if (!NUTS_PLATFORM_ADDRESSES[this.currentNetwork]) return 0;
    return NUTS_PLATFORM_ADDRESSES[this.currentNetwork].instruments[instrument].instrumentId;
  }

  public getInstrumentById(instrumentId: number): string {
    for (let instrument in NUTS_PLATFORM_ADDRESSES[this.currentNetwork].instruments) {
      if (NUTS_PLATFORM_ADDRESSES[this.currentNetwork].instruments[instrument].instrumentId === instrumentId) {
        return instrument;
      }
    }

    return '';
  }

  public async getBlockTimestamp(blockNumber: string): Promise<number> {
    if (this.blockTimestampCache[blockNumber]) {
      return this.blockTimestampCache[blockNumber];
    }
    const block = await this.web3.eth.getBlock(blockNumber);
    this.blockTimestampCache[blockNumber] = block.timestamp;
    return block.timestamp;
  }

  public async retryTransaction(transactionHash: string) {
    const transaction = await this.web3.eth.getTransaction(transactionHash);
    const retryTransaction = {
      from: transaction.from,
      to: transaction.to,
      value: transaction.value,
      data: transaction.input,
      gas: transaction.gas,
      gasPrice: transaction.gasPrice
    };
    return this.web3.eth.sendTransaction(retryTransaction);
  }

  public makeBatchRequest(calls) {
    let batch = new this.web3.BatchRequest();
    let promises = calls.map(call => {
      return new Promise((res, rej) => {
        let req = call.request({ from: this.currentAccount }, (err, data) => {
          if (err) {
            rej(err);
          }
          else {
            res(data);
          }
        });
        batch.add(req)
      })
    })
    batch.execute();

    return Promise.all(promises);
  }

  public async connectToEthereum() {
    const { ethereum } = window;
    try {
      await ethereum.enable();
    } catch (error) {
      console.error(error);
      // Access control error
      this.currentAccount = null;
      this.platformInitializedSubject.next(false);
      return;
    }

    // Important! Let other components handle the initialization result first!
    this.handleAccountChanged([ethereum.selectedAddress]);
    this.handleNetworkChanged(Number(ethereum.networkVersion));
    this.platformInitializedSubject.next(true);
  }

  public getInstrumentEscrowAddress(instrument: string) {
    return NUTS_PLATFORM_ADDRESSES[this.currentNetwork].instruments[instrument].instrumentEscrow;
  }

  public getInstrumentEscrowContract(instrument: string) {
    const instrumentEscrowAddress = NUTS_PLATFORM_ADDRESSES[this.currentNetwork].instruments[instrument].instrumentEscrow;
    return new this.web3.eth.Contract(InstrumentEscrow, instrumentEscrowAddress);
  }

  public getERC20TokenContract(tokenAddress: string) {
    return new this.web3.eth.Contract(ERC20, tokenAddress);
  }

  public getInstrumentManagerContract(instrument: string) {
    const instrumentManagerAddress = NUTS_PLATFORM_ADDRESSES[this.currentNetwork].instruments[instrument].instrumentManager;
    return new this.web3.eth.Contract(InstrumentManager, instrumentManagerAddress);
  }

  private async bootstrapWeb3() {
    const { ethereum } = window;
    if (!ethereum) {
      alert('Please install MetaMask.');
      return;
    }
    this.web3 = new Web3(ethereum);
    ethereum.autoRefreshOnNetworkChange = false;
    try {
      ethereum.on('networkChanged', this.handleNetworkChanged.bind(this));
      ethereum.on('accountsChanged', this.handleAccountChanged.bind(this));
    } catch (error) {
      console.error(error);
    }

    try {
      await ethereum.enable();
    } catch (error) {
      // Access control error
      console.error(error);
      this.currentAccount = null;
      this.platformInitializedSubject.next(false);

      return;
    }

    // Important! Let other components handle the initialization result first!
    this.handleAccountChanged([ethereum.selectedAddress]);
    this.handleNetworkChanged(ethereum.networkVersion);
    console.log('Platform is initialized...');
    this.platformInitializedSubject.next(true);

    // try {
    //   console.log(await ethereum.send('eth_chainId'));
    // } catch (error) {
    //   console.error(error);
    //   // Access control error
    // }

    // try {
    //   console.log(await ethereum.send('eth_requestAccounts'));
    // } catch (error) {
    //   console.error(error);
    //   // Access control error
    // }

    // try {
    //   console.log(await ethereum.send('eth_accounts'));
    // } catch (error) {
    //   console.error(error);
    //   // Access control error
    // }
  }

  private handleAccountChanged(accounts) {
    // If we have received the account addresses
    if (accounts && accounts.length > 0) {
      if (accounts[0] != this.currentAccount) {
        this.currentAccount = accounts[0];
        this.currentAccountSubject.next(accounts[0]);
        console.log('Account updated', this.currentAccount);
      }
    } else if (!this.currentAccount) {
      this.currentAccount = null;
      this.currentAccountSubject.next(null);
    }
  }

  private handleNetworkChanged(network) {
    if (network !== this.currentNetwork) {
      this.currentNetwork = network;
      this.currentNetworkSubject.next(network);
      console.log('Network updated', this.currentNetwork);
    }
  }
}

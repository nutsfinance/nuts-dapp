import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

const Web3 = require('web3');
const ERC20 = require('./abi/IERC20.json');

export const FSP_NAME = 'acoconut.nuts.finance';
export const ETH_ADDRESS = '0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF';
export const USD_ADDRESS = '0x3EfC5E3c4CFFc638E9C506bb0F040EA0d8d3D094';
export const CNY_ADDRESS = '0x2D5254e5905c6671b1804eac23Ba3F1C8773Ee46';
export const CUSTODIAN_ADDRESS = '0xDbE7A2544eeFfec81A7D898Ac08075e0D56FEac6';

declare let require: any;
declare let window: any;

@Injectable({
  providedIn: 'root'
})
export class NutsPlatformService {

  /**
   * Public data that should set in templates.
   */
  public contractAddresses = {
    1: {
      tokens: {
        USDT: '',
        USDC: '',
        DAI: '',
        NUTS: '',
      },
      platform: {
        lending: {
          instrumentManager: '',
          instrumentEscrow: '',
        },
        borrowing: {
          instrumentManager: '',
          instrumentEscrow: '',
        },
        saving: {
          instrumentManager: '',
          instrumentEscrow: '',
        },
        swap: {
          instrumentManager: '',
          instrumentEscrow: '',
        },
        parametersUtil: '',
      },
    },
    3: {
      tokens: {
        USDT: '',
        USDC: '',
        DAI: '',
        NUTS: '',
      },
      platform: {
        lending: {
          instrumentManager: '',
          instrumentEscrow: '',
        },
        borrowing: {
          instrumentManager: '',
          instrumentEscrow: '',
        },
        saving: {
          instrumentManager: '',
          instrumentEscrow: '',
        },
        swap: {
          instrumentManager: '',
          instrumentEscrow: '',
        },
        parametersUtil: '',
      },
    },
    4: {
      tokens: {
        USDT: '0xc48e183cccC9372951DE2423BF2F30E4eA481748',
        USDC: '0x47535B02434C1C8E0A1Cc5f3a7d2E19160E4dF48',
        DAI: '0xb1B522e704B1A50277EEeAC273457Ff90a835301',
        NUTS: '0xCb5Dff1C09C3e454a9415c82CE141824b64DD62D'
      },
      platform: {
        lending: {
          instrumentManager: '0xDf48c167569775299b2Ec61ec9FCAdF82e2e95a8',
          instrumentEscrow: '0xdBDba63369E3aF1f9146BFfb2b468411e6c65F7d',
          instrumentId: 2
        },
        borrowing: {
          instrumentManager: '0xf70df9612df76639f6B1Dcd32A0639a6d065B1fA',
          instrumentEscrow: '0x509b17396821516685725f1Ff854ABd4a8036a33',
          instrumentId: 3
        },
        saving: {
          instrumentManager: '0x861838c70E107494fd89726BdE9C193721aE4D92',
          instrumentEscrow: '0x193d1beBEdb6F62d89D17f94122325d09ff94C72',
          instrumentId: 1
        },
        swap: {
          instrumentManager: '0x6EAC28537e8721CC5F112C647ea5C95Ff8c2d447',
          instrumentEscrow: '0x09A754c505cFfd2a6a34a3c841Ac644Cf0941450',
          instrumentId: 4
        },
        parametersUtil: '0x0604C963c1750D2F440Cf79587441012a05385Af',
        priceOracle: '0x4d3317c4cE37Da043275bb554CC8Cc50FFaaC949'
      }
    },
    42: {
      tokens: {
        USDT: '',
        USDC: '',
        DAI: '',
        NUTS: '',
      },
      platform: {
        lending: {
          instrumentManager: '',
          instrumentEscrow: '',
        },
        borrowing: {
          instrumentManager: '',
          instrumentEscrow: '',
        },
        saving: {
          instrumentManager: '',
          instrumentEscrow: '',
        },
        swap: {
          instrumentManager: '',
          instrumentEscrow: '',
        },
        parametersUtil: '',
      },
    },
    5777: {
      tokens: {
        USDT: '0xD5c8bF575B3A17b80487907d85f721FFaa60abc4',
        USDC: '0xF8D9f137301c52848a79469AcFB576b6477AA380',
        DAI: '0xF9180CB500e1eEFA2140478e2C94106F50c1a0C0',
        NUTS: '0xb16a8a9945FD2361B4157a387380Cfe3Ce240a4A'
      },
      platform: {
        lending: {
          instrumentManager: '0x15DB942F5d876a8169558aEb7664e6e8D8cD6a95',
          instrumentEscrow: '0x05fd6cbF05faD14b0C8F4425FAB2800c24e4A819'
        },
        borrowing: {
          instrumentManager: '0xCCC614fA244D83387798Dc6bd586210D03015495',
          instrumentEscrow: '0x842400448e464F1cFbaC64e2192FFd56D4799bFa'
        },
        saving: {
          instrumentManager: '0x60DcC86b754C611da8f4868E2D3286f12760f9C1',
          instrumentEscrow: '0x78134fFFAA4BE80b7BaC15783C06F2C501F43765'
        },
        swap: {
          instrumentManager: '0x78F01c915A6638e5E5eff7C18EB59279d5d4f5A5',
          instrumentEscrow: '0x3Ba95A5511d364eFc153bA22016c3A7a3d6AB049'
        },
        parametersUtil: '0xEe44022771012b279464716AcE053ef696b5Cae0'
      }
    },
  };

  /**
   * End of public template data
   */

  public web3: any;
  public currentAccount: string;
  public currentAccountSubject = new Subject<string>();
  public currentNetwork: number;
  public currentNetworkSubject = new Subject<number>();

  public transactionSentSubject = new Subject<string>();
  public transactionConfirmedSubject = new Subject<string>();
  public balanceUpdatedSubject = new Subject<string>();

  constructor() {
    window.addEventListener('load', () => {
      this.bootstrapWeb3();
    });
    // this.bootstrapWeb3();
  }

  public getTokenValueByAddress(tokenAddress: string, value: number): number {
    if (tokenAddress.toLowerCase() === ETH_ADDRESS.toLowerCase()) {
      return +this.web3.utils.fromWei(`${value}`, 'ether');
    } else {
      return value;
    }
  }

  public getTokenNameByAddress(tokenAddress: string): string {
    if (tokenAddress.toLowerCase() === ETH_ADDRESS.toLowerCase()) return 'ETH';
    const tokens = this.contractAddresses[this.currentNetwork].tokens;
    for (const tokenName in tokens) {
      if (tokens[tokenName].toLowerCase() === tokenAddress.toLowerCase()) {
        return tokenName;
      }
    }
    return '';
  }

  public getTokenAddressByName(tokenName: string): string {
    if (tokenName === 'ETH') return ETH_ADDRESS;
    return this.contractAddresses[this.currentNetwork].tokens[tokenName];
  }

  public getInstrumentId(instrument: string): number {
    if (!this.contractAddresses[this.currentNetwork]) {
      alert(`Network ${this.currentNetwork} is not supported!`);
      return;
    }
    if (!this.contractAddresses[this.currentNetwork].platform[instrument]) {
      alert(`Instrument ${instrument} is not supported!`);
      return;
    }

    return this.contractAddresses[this.currentNetwork].platform[instrument].instrumentId;
  }

  public getInstrumentById(instrumentId: number): string {
    if (!this.contractAddresses[this.currentNetwork]) {
      alert(`Network ${this.currentNetwork} is not supported!`);
      return;
    }
    for (let instrument in this.contractAddresses[this.currentNetwork].platform) {
      if (this.contractAddresses[this.currentNetwork].platform[instrument].instrumentId === instrumentId) {
        return instrument;
      }
    }

    return '';
  }

  public async getAccountBalance(token: string): Promise<number> {
    if (!this.web3 || !this.currentAccount) {
      return Promise.resolve(0);
    }

    if (token === 'ETH') {
      const weiBalance = await this.web3.eth.getBalance(this.currentAccount);
      return +this.web3.utils.fromWei(weiBalance, 'ether');
    } else if (token && this.contractAddresses[this.currentNetwork]
      && this.contractAddresses[this.currentNetwork].tokens[token]) {
      const tokenAddress = this.contractAddresses[this.currentNetwork].tokens[token];
      const tokenContract = new this.web3.eth.Contract(ERC20, tokenAddress);
      return tokenContract.methods.balanceOf(this.currentAccount).call();
    } else {
      return Promise.resolve(0);
    }
  }

  public async getBlockTimestamp(blockNumber: string): Promise<number> {
    const block = await this.web3.eth.getBlock(blockNumber);
    return block.timestamp;
  }

  private async bootstrapWeb3() {
    console.log('Bootstrap web3');
    const { ethereum } = window;
    if (!ethereum || !ethereum.isMetaMask) {
      throw new Error('Please install MetaMask.')
    }
    this.web3 = new Web3(ethereum);
    ethereum.on('accountsChanged', this.handleAccountChanged.bind(this));
    ethereum.on('networkChanged', this.handleNetworkChanged.bind(this));
    console.log(ethereum);
    try {
      await ethereum.enable();
    } catch (error) {
      console.error(error);
      // Access control error
    }

    this.handleAccountChanged([ethereum.selectedAddress]);
    this.handleNetworkChanged(Number(ethereum.networkVersion));

    // try {
    //   this.handleNetworkChanged(await ethereum.send('eth_chainId'));
    //   this.handleAccountChanged(await ethereum.send('eth_accounts'));
    // } catch (error) {
    //   console.error(error);
    //   // Access control error
    // }
  }

  private handleAccountChanged(accounts) {
    console.log('Account changed', accounts);
    if (accounts && accounts.length > 0 && accounts[0] != this.currentAccount) {
      this.currentAccount = accounts[0];
      this.currentAccountSubject.next(accounts[0]);
      console.log('Account updated', this.currentAccount);
    }
  }

  private handleNetworkChanged(network) {
    console.log('Network changed', network);
    if (network && network != this.currentNetwork) {
      this.currentNetwork = network;
      this.currentNetworkSubject.next(network);
      console.log('Network updated', this.currentNetwork);
    }
  }
}

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

const Web3 = require('web3');
const ERC20 = require('./abi/IERC20.json');
const InstrumentManager = require('./abi/InstrumentManagerInterface.json');
const InstrumentEscrow = require('./abi/InstrumentEscrowInterface.json');
const IssuanceEscrow = require('./abi/IssuanceEscrowInterface.json');
const ParametersUtil = require('./abi/ParametersUtil.json');

declare let require: any;
declare let window: any;

@Injectable({
  providedIn: 'root'
})
export class NutsPlatformService {
  private web3: any;
  private contractAddresses = {
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

  public async getTokenBalance(token: string): Promise<number> {
    if (!this.web3 || !this.currentAccount) {
      return Promise.resolve(0);
    }
    console.log(token);
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
    }
  }
}

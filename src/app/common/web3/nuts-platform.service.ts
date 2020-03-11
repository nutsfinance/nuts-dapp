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
        USDT: '0x681E4010cB8bEc4C0791efE3cd8995769C2BB834',
        USDC: '0xF9f5cD9ed0c49DA15ba6AA193135dc43ba5C75A5',
        DAI: '0x8A241dd06a7705b156c2E2162A458eE1F872b4D7',
        NUTS: '0x200C7Fa2eFaBeA8948F5FA631ec4261215e03905'
      },
      platform: {
        saving: {
          instrumentManager: '0xa784E55eE41EE9d0e42Cb18beFbE8B5E82122348',
          instrumentEscrow: '0xf190adD83C9699225AE0a5d06f977247189B4D93',
          instrumentId: 1
        },
        lending: {
          instrumentManager: '0x6750e54508acBE32743e418985081d8926134963',
          instrumentEscrow: '0x567B1f22f5C55f2c7Ad6FB854C10c20A6A7De84E',
          instrumentId: 2
        },
        borrowing: {
          instrumentManager: '0x3265A0d5963cCfc385598A4F2D442fee23AB9C7A',
          instrumentEscrow: '0x67Be51718093A3e3A658CE9ed8AfC6072C39Ee44',
          instrumentId: 3
        },
        swap: {
          instrumentManager: '0x801D85D216949Fe54bD37c0ce467727a6AB0D364',
          instrumentEscrow: '0xe33a3b552Cc5d9860CDb1a547B513Fc83cAfE772',
          instrumentId: 4
        },
        instrumentRegistry: '0xdd76F019147cb81c55e41E94191A23399810814e',
        parametersUtil: '0xBE5d57b520bC825bEe5a6E04eB52b2fbA7a5BACb',
        priceOracle: '0xee8452F333b2Bb8610d6C78fEb82FF0D5962BABf'
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

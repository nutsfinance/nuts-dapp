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
        USDT: '0x8e4A3E7ED6F4A529AD803a963333C320900789cE',
        USDC: '0x7f0fe444702d421421a59A124aCC6AfB220c1683',
        DAI: '0x89050cd5C37c852125245B5dcDf3DB49775f239a',
        NUTS: '0x41A0AC24D1f4664Ab623756Cf6B87B6750470cfd'
      },
      platform: {
        lending: {
          instrumentManager: '0x5B0E5c566700dCEF12ae6D2Aa577bc720858Edc5',
          instrumentEscrow: '0xfF304d9a02d04601c289EB955B09179201B0f972'
        },
        borrowing: {
          instrumentManager: '0xdCf52926CcA5344F776C5d8AE78a73fac87BC723',
          instrumentEscrow: '0x9478a88Bcb3351bB6A060891288731F4C9CDA027'
        },
        saving: {
          instrumentManager: '0x4Cd3d1d6b3E8cbC2E481502d1d21806C5aAB6f6E',
          instrumentEscrow: '0x1B4EEBDaB18df7A049D538a1F7180A5Ff8788401'
        },
        swap: {
          instrumentManager: '0x9Dfd2D5d921bd25a5023Fd58bc252485c18DaD94',
          instrumentEscrow: '0xc517A0937a08E2DfA2b819567Add4f15d1Af0e8D'
        },
        parametersUtil: '0xb0501a061cAc17Db1C46Fe83724a9BAc6Ce14d42'
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

  public async getInstrumentEscrowBalance(instrument: string, token: string): Promise<number> {
    if (!this.web3 || !this.currentAccount) {
      return Promise.resolve(0);
    }
    if (this.contractAddresses[this.currentNetwork] && this.contractAddresses[this.currentNetwork].platform[instrument]) {
      const instrumentEscrowAddress = this.contractAddresses[this.currentNetwork].platform[instrument].instrumentEscrow;
      const instrumentEscrow = new this.web3.eth.Contract(InstrumentEscrow, instrumentEscrowAddress);
      if (token === 'ETH') {
        const weiBalance = await instrumentEscrow.methods.getBalance(this.currentAccount).call();
        console.log(weiBalance);
        return +this.web3.utils.fromWei(weiBalance, 'ether');
      } else if (this.contractAddresses[this.currentNetwork].tokens[token]) {
        const tokenAddress = this.contractAddresses[this.currentNetwork].tokens[token];
        return instrumentEscrow.methods.getTokenBalance(this.currentAccount, tokenAddress).call();
      } else {
        return Promise.resolve(0);
      }
    } else {
      return Promise.resolve(0);
    }
  }

  public async approve(instrument: string, token: string, amount: number) {
    if (!this.contractAddresses[this.currentNetwork]) {
      alert(`Network ${this.currentNetwork} is not supported!`);
    }
    if (!this.contractAddresses[this.currentNetwork].platform[instrument]) {
      alert(`Instrument ${instrument} is not supported!`);
    }
    if (!this.contractAddresses[this.currentNetwork].tokens[token]) {
      alert(`Token ${token} is not supported!`);
    }

    const instrumentEscrowAddress = this.contractAddresses[this.currentNetwork].platform[instrument].instrumentEscrow;
    const tokenAddress = this.contractAddresses[this.currentNetwork].tokens[token];
    const tokenContract = new this.web3.eth.Contract(ERC20, tokenAddress);
    return tokenContract.methods.approve(instrumentEscrowAddress, amount).send({from: this.currentAccount})
      .on('transactionHash', (transactionHash) => {
        console.log(transactionHash);
        this.transactionSentSubject.next(transactionHash);
      })
      .on('receipt', (receipt) => {
        console.log(receipt);
        this.transactionConfirmedSubject.next(receipt.transactionHash);
      });
  }

  public async depositETH(instrument: string, amount: number) {
    if (!this.contractAddresses[this.currentNetwork]) {
      alert(`Network ${this.currentNetwork} is not supported!`);
    }
    if (!this.contractAddresses[this.currentNetwork].platform[instrument]) {
      alert(`Instrument ${instrument} is not supported!`);
    }

    const instrumentEscrowAddress = this.contractAddresses[this.currentNetwork].platform[instrument].instrumentEscrow;
    const instrumentEscrowContract = new this.web3.eth.Contract(InstrumentEscrow, instrumentEscrowAddress);
    return instrumentEscrowContract.methods.deposit().send({from: this.currentAccount, value: this.web3.utils.toWei(amount, 'ether')})
      .on('transactionHash', (transactionHash) => {
        console.log(transactionHash);
        this.transactionSentSubject.next(transactionHash);
      })
      .on('receipt', (receipt) => {
        console.log(receipt);
        this.transactionConfirmedSubject.next(receipt.transactionHash);
      });
  }

  public async depositToken(instrument: string, token: string, amount: number) {
    if (!this.contractAddresses[this.currentNetwork]) {
      alert(`Network ${this.currentNetwork} is not supported!`);
    }
    if (!this.contractAddresses[this.currentNetwork].platform[instrument]) {
      alert(`Instrument ${instrument} is not supported!`);
    }
    if (!this.contractAddresses[this.currentNetwork].tokens[token]) {
      alert(`Token ${token} is not supported!`);
    }

    const instrumentEscrowAddress = this.contractAddresses[this.currentNetwork].platform[instrument].instrumentEscrow;
    const instrumentEscrowContract = new this.web3.eth.Contract(InstrumentEscrow, instrumentEscrowAddress);
    const tokenAddress = this.contractAddresses[this.currentNetwork].tokens[token];
    return instrumentEscrowContract.methods.depositToken(tokenAddress, amount).send({from: this.currentAccount})
      .on('transactionHash', (transactionHash) => {
        console.log(transactionHash);
        this.transactionSentSubject.next(transactionHash);
      })
      .on('receipt', (receipt) => {
        console.log(receipt);
        this.transactionConfirmedSubject.next(receipt.transactionHash);
      });
  }

  public async withdrawETH(instrument: string, amount: number) {
    if (!this.contractAddresses[this.currentNetwork]) {
      alert(`Network ${this.currentNetwork} is not supported!`);
    }
    if (!this.contractAddresses[this.currentNetwork].platform[instrument]) {
      alert(`Instrument ${instrument} is not supported!`);
    }

    const instrumentEscrowAddress = this.contractAddresses[this.currentNetwork].platform[instrument].instrumentEscrow;
    const instrumentEscrowContract = new this.web3.eth.Contract(InstrumentEscrow, instrumentEscrowAddress);
    return instrumentEscrowContract.methods.withdraw(this.web3.utils.toWei(amount, 'ether')).send({from: this.currentAccount})
      .on('transactionHash', (transactionHash) => {
        console.log(transactionHash);
        this.transactionSentSubject.next(transactionHash);
      })
      .on('receipt', (receipt) => {
        console.log(receipt);
        this.transactionConfirmedSubject.next(receipt.transactionHash);
      });
  }

  public async withdrawToken(instrument: string, token: string, amount: number) {
    if (!this.contractAddresses[this.currentNetwork]) {
      alert(`Network ${this.currentNetwork} is not supported!`);
    }
    if (!this.contractAddresses[this.currentNetwork].platform[instrument]) {
      alert(`Instrument ${instrument} is not supported!`);
    }
    if (!this.contractAddresses[this.currentNetwork].tokens[token]) {
      alert(`Token ${token} is not supported!`);
    }

    const instrumentEscrowAddress = this.contractAddresses[this.currentNetwork].platform[instrument].instrumentEscrow;
    const instrumentEscrowContract = new this.web3.eth.Contract(InstrumentEscrow, instrumentEscrowAddress);
    const tokenAddress = this.contractAddresses[this.currentNetwork].tokens[token];
    return instrumentEscrowContract.methods.withdrawToken(tokenAddress, amount).send({from: this.currentAccount})
      .on('transactionHash', (transactionHash) => {
        console.log(transactionHash);
        this.transactionSentSubject.next(transactionHash);
      })
      .on('receipt', (receipt) => {
        console.log(receipt);
        this.transactionConfirmedSubject.next(receipt.transactionHash);
      });
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

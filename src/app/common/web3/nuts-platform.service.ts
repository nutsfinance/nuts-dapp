import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { LendingData } from 'nuts-platform-protobuf-messages';
import { LendingIssuanceModel } from '../model/lending-issuance.model';

const Web3 = require('web3');
const ERC20 = require('./abi/IERC20.json');
const InstrumentManager = require('./abi/InstrumentManagerInterface.json');
const InstrumentEscrow = require('./abi/InstrumentEscrowInterface.json');
const IssuanceEscrow = require('./abi/IssuanceEscrowInterface.json');
const ParametersUtil = require('./abi/ParametersUtil.json');

const INTEREST_RATE_DECIMALS = 10000;
const COLLATERAL_RATIO_DECIMALS = 100;
const ETH_ADDRESS = '0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF';

declare let require: any;
declare let window: any;

export interface WalletTransaction {
  deposit: boolean,
  token: string,
  amount: number,
  transactionHash: string,
  blockNumber: number,
}

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
        USDT: '0xF2d3a89be3a9A499b08F79C2727bE912febed26C',
        USDC: '0x6111835ded0d415cD3D102A4A1b1d2015c1ee8BE',
        DAI: '0x6ab06cd020eb552Ef9f0e3A48ccA93Bb6dA7B7Ef',
        NUTS: '0x51d3F129e5Fb1F1A0010bff7750DDd36651F450e'
      },
      platform: {
        lending: {
          instrumentManager: '0xffc0D9B27902880710b801ee565Ec1D495E747E0',
          instrumentEscrow: '0x7148ac3E660083edB4FD308e089297e9657F2a37'
        },
        borrowing: {
          instrumentManager: '0xC2D4EC94001e837AC11797B7675682D37AE3C4F8',
          instrumentEscrow: '0xDe280CdD16F6E7f26768d928Ff5D304655D9A21D'
        },
        saving: {
          instrumentManager: '0x146F6b69eCa3c0eF79b7CEa05A57d5Bc43543F23',
          instrumentEscrow: '0x1269f24AcA218788A55e948ef84b74C099ce98dE'
        },
        swap: {
          instrumentManager: '0x1C0c3A5b50dBc3A7f150AB00259Fcf6804F4e310',
          instrumentEscrow: '0x67423902D8021808Fc072254Ab236A9027C96291'
        },
        parametersUtil: '0xC75686859e6687508049EC373115dc803b10b3d9'
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

  public lendingIssuances: LendingIssuanceModel[] = [];
  public lendingIssuancesUpdatedSubject = new Subject<LendingIssuanceModel[]>();

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
        // const weiBalance = await instrumentEscrow.methods.getTokenBalance(this.currentAccount, ETH_ADDRESS).call();
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

  public async withdrawETH(instrument: string, amount: string) {
    if (!this.contractAddresses[this.currentNetwork]) {
      alert(`Network ${this.currentNetwork} is not supported!`);
    }
    if (!this.contractAddresses[this.currentNetwork].platform[instrument]) {
      alert(`Instrument ${instrument} is not supported!`);
    }

    const instrumentEscrowAddress = this.contractAddresses[this.currentNetwork].platform[instrument].instrumentEscrow;
    const instrumentEscrowContract = new this.web3.eth.Contract(InstrumentEscrow, instrumentEscrowAddress);
    return instrumentEscrowContract.methods.withdraw(this.web3.utils.toWei(`${amount}`, 'ether')).send({from: this.currentAccount})
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

  public async getWalletTransactions(instrument: string): Promise<WalletTransaction[]> {
    if (!this.contractAddresses[this.currentNetwork]) {
      return [];
    }
    if (!this.contractAddresses[this.currentNetwork].platform[instrument]) {
      return [];
    }
    const instrumentEscrowAddress = this.contractAddresses[this.currentNetwork].platform[instrument].instrumentEscrow;
    const instrumentEscrowContract = new this.web3.eth.Contract(InstrumentEscrow, instrumentEscrowAddress);
    const instrumentEscrowEvents = await instrumentEscrowContract.getPastEvents('allEvents', {fromBlock: 0, toBlock: 'latest'});
    const transactions: WalletTransaction[] = [];
    instrumentEscrowEvents.forEach((escrowEvent) => {
      if (escrowEvent.event === 'Deposited' && escrowEvent.returnValues.depositer.toLowerCase() === this.currentAccount.toLowerCase()) {
        transactions.push({
          deposit: true,
          token: 'ETH',
          amount: this.web3.utils.fromWei(escrowEvent.returnValues.amount, 'ether'),
          transactionHash: escrowEvent.transactionHash,
          blockNumber: escrowEvent.blockNumber,
        });
      } else if (escrowEvent.event === 'Withdrawn' && escrowEvent.returnValues.withdrawer.toLowerCase() === this.currentAccount.toLowerCase()) {
        transactions.push({
          deposit: false,
          token: 'ETH',
          amount: this.web3.utils.fromWei(escrowEvent.returnValues.amount, 'ether'),
          transactionHash: escrowEvent.transactionHash,
          blockNumber: escrowEvent.blockNumber,
        });
      } else if (escrowEvent.event === 'TokenDeposited' && escrowEvent.returnValues.depositer.toLowerCase() === this.currentAccount.toLowerCase()) {
        transactions.push({
          deposit: true,
          token: this.getTokenByAddress(escrowEvent.returnValues.token),
          amount: escrowEvent.returnValues.amount,
          transactionHash: escrowEvent.transactionHash,
          blockNumber: escrowEvent.blockNumber,
        });
      } else if (escrowEvent.event === 'TokenWithdrawn' && escrowEvent.returnValues.withdrawer.toLowerCase() === this.currentAccount.toLowerCase()) {
        transactions.push({
          deposit: false,
          token: this.getTokenByAddress(escrowEvent.returnValues.token),
          amount: escrowEvent.returnValues.amount,
          transactionHash: escrowEvent.transactionHash,
          blockNumber: escrowEvent.blockNumber,
        });
      }
    });
    return transactions.sort((e1, e2) => e1.blockNumber - e2.blockNumber);;
  }

  public async getBlockTimestamp(blockNumber: string): Promise<number> {
    const block = await this.web3.eth.getBlock(blockNumber);
    return block.timestamp;
  }

  public async createLendingIssuance(principalToken: string, principalAmount: number, collateralToken: string,
      collateralRatio: number, tenor: number, interestRate: number) {
    if (!this.contractAddresses[this.currentNetwork]) {
      alert(`Network ${this.currentNetwork} is not supported!`);
      return;
    }
    if (!this.contractAddresses[this.currentNetwork].platform.lending) {
      alert(`Instrument lending is not supported!`);
      return;
    }
    if (principalToken !== 'ETH' && !this.contractAddresses[this.currentNetwork].tokens[principalToken]) {
      alert(`Token ${principalToken} is not supported!`);
      return;
    }
    if (collateralToken !== 'ETH' && !this.contractAddresses[this.currentNetwork].tokens[collateralToken]) {
      alert(`Token ${collateralToken} is not supported!`);
      return;
    }
    const parametersUtilAddress = this.contractAddresses[this.currentNetwork].platform.parametersUtil;
    const parametersUtilContract = new this.web3.eth.Contract(ParametersUtil, parametersUtilAddress);

    const principalTokenAddress = principalToken === 'ETH' ? ETH_ADDRESS : this.contractAddresses[this.currentNetwork].tokens[principalToken];
    const lendingAmount = principalToken === 'ETH' ? this.web3.utils.toWei(principalAmount, 'ether') : principalAmount;
    const collateralTokenAddress = collateralToken === 'ETH' ? ETH_ADDRESS : this.contractAddresses[this.currentNetwork].tokens[collateralToken];
    console.log(collateralTokenAddress, principalTokenAddress, lendingAmount,
      collateralRatio * COLLATERAL_RATIO_DECIMALS, tenor, interestRate * INTEREST_RATE_DECIMALS);
    const lendingParameters = await parametersUtilContract.methods.getLendingMakerParameters(collateralTokenAddress, principalTokenAddress, lendingAmount,
      collateralRatio * COLLATERAL_RATIO_DECIMALS, tenor, interestRate * INTEREST_RATE_DECIMALS).call({from: this.currentAccount});

    const instrumentManagerAddress = this.contractAddresses[this.currentNetwork].platform.lending.instrumentManager;
    const instrumentManagerContract = new this.web3.eth.Contract(InstrumentManager, instrumentManagerAddress);
    return instrumentManagerContract.methods.createIssuance(lendingParameters).send({from: this.currentAccount, gas: 6721975})
      .on('transactionHash', (transactionHash) => {
        console.log(transactionHash);
        this.transactionSentSubject.next(transactionHash);
      })
      .on('receipt', (receipt) => {
        console.log(receipt);
        this.transactionConfirmedSubject.next(receipt.transactionHash);
      });
      
  }

  public async getLendingIssuances() {
    if (!this.currentAccount || !this.currentNetwork) {
      console.log('Either account or network is not set.');
    }
    if (!this.contractAddresses[this.currentNetwork]) {
      alert(`Network ${this.currentNetwork} is not supported!`);
      return;
    }
    if (!this.contractAddresses[this.currentNetwork].platform.lending) {
      alert(`Instrument lending is not supported!`);
      return;
    }
    const instrumentManagerAddress = this.contractAddresses[this.currentNetwork].platform.lending.instrumentManager;
    const instrumentManagerContract = new this.web3.eth.Contract(InstrumentManager, instrumentManagerAddress);
    const issuanceCount = await instrumentManagerContract.methods.getLastIssuanceId().call({from: this.currentAccount});
    console.log(issuanceCount);
    
    const batchedRequests = [];
   for (let i = 1; i <= issuanceCount; i++) {
      batchedRequests.push(instrumentManagerContract.methods.getCustomData(i, this.web3.utils.fromAscii("lending_data")).call);
    }
    const lendingData = await this.makeBatchRequest(batchedRequests);
    this.lendingIssuances = lendingData.map((data: string) => {
      const lendingCompleteProperties = LendingData.LendingCompleteProperties.deserializeBinary(Uint8Array.from(Buffer.from(data.substring(2), 'hex')));
      const lendingIssuance = LendingIssuanceModel.fromMessage(lendingCompleteProperties);
      console.log(lendingIssuance);
      return lendingIssuance;
    });
    this.lendingIssuancesUpdatedSubject.next(this.lendingIssuances);
    console.log(this.lendingIssuances);
  }

  private makeBatchRequest(calls) {
    let batch = new this.web3.BatchRequest();

    let promises = calls.map(call => {
        return new Promise((res, rej) => {
            let req = call.request({from: this.currentAccount}, (err, data) => {
                if(err) rej(err);
                else res(data)
            });
            batch.add(req)
        })
    })
    batch.execute();

    return Promise.all(promises);
  }

  public getTokenByAddress(tokenAddress: string): string {
    if (tokenAddress === ETH_ADDRESS) return 'ETH';
    const tokens = this.contractAddresses[this.currentNetwork].tokens;
    for (const tokenName in tokens) {
      if (tokens[tokenName].toLowerCase() === tokenAddress.toLowerCase()) {
        return tokenName;
      }
    }
    return '';
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
      this.getLendingIssuances();
    }
  }
}

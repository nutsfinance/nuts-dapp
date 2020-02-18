import { Injectable } from '@angular/core';
import { NotificationService } from '../../notification/notification.service';
import { TransactionModel, TransactionType } from '../../notification/transaction.model';
import { ETH_ADDRESS, NutsPlatformService } from './nuts-platform.service';


const ERC20 = require('./abi/IERC20.json');
const InstrumentEscrow = require('./abi/InstrumentEscrowInterface.json');
const IssuanceEscrow = require('./abi/IssuanceEscrowInterface.json');

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
export class InstrumentEscrowService {

  constructor(private nutsPlatformService: NutsPlatformService, private notificationService: NotificationService) { }

  public async getWalletBalance(instrument: string, token: string): Promise<number> {
    if (!this.nutsPlatformService.web3 || !this.nutsPlatformService.currentAccount) {
      return Promise.resolve(0);
    }
    if (this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork] && this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform[instrument]) {
      const instrumentEscrowAddress = this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform[instrument].instrumentEscrow;
      const instrumentEscrow = new this.nutsPlatformService.web3.eth.Contract(InstrumentEscrow, instrumentEscrowAddress);
      if (token === 'ETH') {
        const weiBalance = await instrumentEscrow.methods.getBalance(this.nutsPlatformService.currentAccount).call();
        // const weiBalance = await instrumentEscrow.methods.getTokenBalance(this.nutsPlatformService.currentAccount, ETH_ADDRESS).call();
        console.log(weiBalance);
        return +this.nutsPlatformService.web3.utils.fromWei(weiBalance, 'ether');
      } else if (this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].tokens[token]) {
        const tokenAddress = this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].tokens[token];
        return instrumentEscrow.methods.getTokenBalance(this.nutsPlatformService.currentAccount, tokenAddress).call();
      } else {
        return Promise.resolve(0);
      }
    } else {
      return Promise.resolve(0);
    }
  }

  public approve(instrument: string, token: string, amount: number) {
    if (!this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork]) {
      alert(`Network ${this.nutsPlatformService.currentNetwork} is not supported!`);
    }
    if (!this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform[instrument]) {
      alert(`Instrument ${instrument} is not supported!`);
    }
    if (!this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].tokens[token]) {
      alert(`Token ${token} is not supported!`);
    }

    const instrumentEscrowAddress = this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform[instrument].instrumentEscrow;
    const tokenAddress = this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].tokens[token];
    const tokenContract = new this.nutsPlatformService.web3.eth.Contract(ERC20, tokenAddress);
    return tokenContract.methods.approve(instrumentEscrowAddress, amount).send({ from: this.nutsPlatformService.currentAccount })
      .on('transactionHash', (transactionHash) => {
        console.log(transactionHash);
        // this.nutsPlatformService.transactionSentSubject.next(transactionHash);

        // Records the transaction
        const depositTransaction = new TransactionModel(transactionHash, TransactionType.APPROVE,
          this.nutsPlatformService.currentAccount, this.nutsPlatformService.getInstrumentId(instrument),
          {
            tokenAddress: token,
            amount: `${amount}`,
          }
        );
        this.notificationService.addTransaction(depositTransaction).subscribe(result => console.log(result));
        // Refreshes the notification
        this.notificationService.getNotifications(this.nutsPlatformService.currentAccount);
      })
      .on('receipt', (receipt) => {
        console.log(receipt);
        // this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
      });
  }

  public depositETH(instrument: string, amount: number) {
    if (!this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork]) {
      alert(`Network ${this.nutsPlatformService.currentNetwork} is not supported!`);
    }
    if (!this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform[instrument]) {
      alert(`Instrument ${instrument} is not supported!`);
    }

    const instrumentEscrowAddress = this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform[instrument].instrumentEscrow;
    const instrumentEscrowContract = new this.nutsPlatformService.web3.eth.Contract(InstrumentEscrow, instrumentEscrowAddress);
    return instrumentEscrowContract.methods.deposit().send({ from: this.nutsPlatformService.currentAccount, value: this.nutsPlatformService.web3.utils.toWei(amount, 'ether') })
      .on('transactionHash', (transactionHash) => {
        console.log(transactionHash);
        // this.nutsPlatformService.transactionSentSubject.next(transactionHash);

        // Records the transaction
        const depositTransaction = new TransactionModel(transactionHash, TransactionType.DEPOSIT,
          this.nutsPlatformService.currentAccount, this.nutsPlatformService.getInstrumentId(instrument),
          {
            tokenAddress: ETH_ADDRESS,
            amount: `${amount}`,
          }
        );
        this.notificationService.addTransaction(depositTransaction).subscribe(result => console.log(result));
        // Refreshes the notification
        this.notificationService.getNotifications(this.nutsPlatformService.currentAccount);
      })
      .on('receipt', (receipt) => {
        console.log(receipt);
        // this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
      });
  }

  public depositToken(instrument: string, token: string, amount: number) {
    if (!this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork]) {
      alert(`Network ${this.nutsPlatformService.currentNetwork} is not supported!`);
    }
    if (!this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform[instrument]) {
      alert(`Instrument ${instrument} is not supported!`);
    }
    if (!this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].tokens[token]) {
      alert(`Token ${token} is not supported!`);
    }

    const instrumentEscrowAddress = this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform[instrument].instrumentEscrow;
    const instrumentEscrowContract = new this.nutsPlatformService.web3.eth.Contract(InstrumentEscrow, instrumentEscrowAddress);
    const tokenAddress = this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].tokens[token];
    return instrumentEscrowContract.methods.depositToken(tokenAddress, amount).send({ from: this.nutsPlatformService.currentAccount })
      .on('transactionHash', (transactionHash) => {
        console.log(transactionHash);
        // this.nutsPlatformService.transactionSentSubject.next(transactionHash);

        // Records the transaction
        const depositTransaction = new TransactionModel(transactionHash, TransactionType.DEPOSIT,
          this.nutsPlatformService.currentAccount, this.nutsPlatformService.getInstrumentId(instrument),
          {
            tokenAddress: token,
            amount: `${amount}`,
          }
        );
        this.notificationService.addTransaction(depositTransaction).subscribe(result => console.log(result));
        // Refreshes the notification
        this.notificationService.getNotifications(this.nutsPlatformService.currentAccount);
      })
      .on('receipt', (receipt) => {
        console.log(receipt);
        // this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
      });
  }

  public withdrawETH(instrument: string, amount: string) {
    if (!this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork]) {
      alert(`Network ${this.nutsPlatformService.currentNetwork} is not supported!`);
    }
    if (!this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform[instrument]) {
      alert(`Instrument ${instrument} is not supported!`);
    }

    const instrumentEscrowAddress = this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform[instrument].instrumentEscrow;
    const instrumentEscrowContract = new this.nutsPlatformService.web3.eth.Contract(InstrumentEscrow, instrumentEscrowAddress);
    return instrumentEscrowContract.methods.withdraw(this.nutsPlatformService.web3.utils.toWei(`${amount}`, 'ether')).send({ from: this.nutsPlatformService.currentAccount })
      .on('transactionHash', (transactionHash) => {
        console.log(transactionHash);
        // this.nutsPlatformService.transactionSentSubject.next(transactionHash);

        // Records the transaction
        const depositTransaction = new TransactionModel(transactionHash, TransactionType.WITHDRAW,
          this.nutsPlatformService.currentAccount, this.nutsPlatformService.getInstrumentId(instrument),
          {
            tokenAddress: ETH_ADDRESS,
            amount: `${amount}`,
          }
        );
        this.notificationService.addTransaction(depositTransaction).subscribe(result => console.log(result));
        // Refreshes the notification
        this.notificationService.getNotifications(this.nutsPlatformService.currentAccount);
      })
      .on('receipt', (receipt) => {
        console.log(receipt);
        // this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
      });
  }

  public withdrawToken(instrument: string, token: string, amount: number) {
    if (!this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork]) {
      alert(`Network ${this.nutsPlatformService.currentNetwork} is not supported!`);
    }
    if (!this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform[instrument]) {
      alert(`Instrument ${instrument} is not supported!`);
    }
    if (!this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].tokens[token]) {
      alert(`Token ${token} is not supported!`);
    }

    const instrumentEscrowAddress = this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform[instrument].instrumentEscrow;
    const instrumentEscrowContract = new this.nutsPlatformService.web3.eth.Contract(InstrumentEscrow, instrumentEscrowAddress);
    const tokenAddress = this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].tokens[token];
    return instrumentEscrowContract.methods.withdrawToken(tokenAddress, amount).send({ from: this.nutsPlatformService.currentAccount })
      .on('transactionHash', (transactionHash) => {
        console.log(transactionHash);
        // this.nutsPlatformService.transactionSentSubject.next(transactionHash);

        // Records the transaction
        const depositTransaction = new TransactionModel(transactionHash, TransactionType.WITHDRAW,
          this.nutsPlatformService.currentAccount, this.nutsPlatformService.getInstrumentId(instrument),
          {
            tokenAddress: token,
            amount: `${amount}`,
          }
        );
        this.notificationService.addTransaction(depositTransaction).subscribe(result => console.log(result));
        // Refreshes the notification
        this.notificationService.getNotifications(this.nutsPlatformService.currentAccount);
      })
      .on('receipt', (receipt) => {
        console.log(receipt);
        // this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
      });
  }

  public async getWalletTransactions(instrument: string): Promise<WalletTransaction[]> {
    if (!this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork]) {
      return [];
    }
    if (!this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform[instrument]) {
      return [];
    }
    const instrumentEscrowAddress = this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform[instrument].instrumentEscrow;
    const instrumentEscrowContract = new this.nutsPlatformService.web3.eth.Contract(InstrumentEscrow, instrumentEscrowAddress);
    const instrumentEscrowEvents = await instrumentEscrowContract.getPastEvents('allEvents', { fromBlock: 0, toBlock: 'latest' });
    const transactions: WalletTransaction[] = [];
    instrumentEscrowEvents.forEach((escrowEvent) => {
      if (escrowEvent.event === 'Deposited' && escrowEvent.returnValues.depositer.toLowerCase() === this.nutsPlatformService.currentAccount.toLowerCase()) {
        transactions.push({
          deposit: true,
          token: 'ETH',
          amount: this.nutsPlatformService.web3.utils.fromWei(escrowEvent.returnValues.amount, 'ether'),
          transactionHash: escrowEvent.transactionHash,
          blockNumber: escrowEvent.blockNumber,
        });
      } else if (escrowEvent.event === 'Withdrawn' && escrowEvent.returnValues.withdrawer.toLowerCase() === this.nutsPlatformService.currentAccount.toLowerCase()) {
        transactions.push({
          deposit: false,
          token: 'ETH',
          amount: this.nutsPlatformService.web3.utils.fromWei(escrowEvent.returnValues.amount, 'ether'),
          transactionHash: escrowEvent.transactionHash,
          blockNumber: escrowEvent.blockNumber,
        });
      } else if (escrowEvent.event === 'TokenDeposited' && escrowEvent.returnValues.depositer.toLowerCase() === this.nutsPlatformService.currentAccount.toLowerCase()) {
        transactions.push({
          deposit: true,
          token: this.nutsPlatformService.getTokenNameByAddress(escrowEvent.returnValues.token),
          amount: escrowEvent.returnValues.amount,
          transactionHash: escrowEvent.transactionHash,
          blockNumber: escrowEvent.blockNumber,
        });
      } else if (escrowEvent.event === 'TokenWithdrawn' && escrowEvent.returnValues.withdrawer.toLowerCase() === this.nutsPlatformService.currentAccount.toLowerCase()) {
        transactions.push({
          deposit: false,
          token: this.nutsPlatformService.getTokenNameByAddress(escrowEvent.returnValues.token),
          amount: escrowEvent.returnValues.amount,
          transactionHash: escrowEvent.transactionHash,
          blockNumber: escrowEvent.blockNumber,
        });
      }
    });
    return transactions.sort((e1, e2) => e1.blockNumber - e2.blockNumber);;
  }
}

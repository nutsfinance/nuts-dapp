import { Injectable } from '@angular/core';
import { NotificationService } from '../../notification/notification.service';
import { TransactionModel, TransactionType, NotificationRole } from '../../notification/transaction.model';
import { ETH_ADDRESS, NutsPlatformService } from './nuts-platform.service';

const ERC20 = require('./abi/IERC20.json');
const InstrumentEscrow = require('./abi/InstrumentEscrowInterface.json');

export interface AccountTransaction {
  deposit: boolean,
  token: string,
  amount: number,
  transactionHash: string,
  blockNumber: number,
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {

  constructor(private nutsPlatformService: NutsPlatformService, private notificationService: NotificationService) {
    // // Updates balance information if it's 
    // this.notificationService.newNotificationSubject.subscribe(newNotification => {
    //   if (newNotification.category === NotificationCategory.TRANSACTION_CONFIRMED) {
    //     console.log('New notification', newNotification);
    //     switch(newNotification.type) {
    //       case TransactionType.DEPOSIT:
    //       case TransactionType.WITHDRAW:
    //         this.nutsPlatformService.balanceUpdatedSubject.next(newNotification.metadata['tokenName']);
    //         return;
    //     }
    //   }
    // });
  }

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
    console.log({
      instrumentName: instrument,
      tokenName: token,
      tokenAddress,
      amount: `${amount}`,
    });
    return tokenContract.methods.approve(instrumentEscrowAddress, amount).send({ from: this.nutsPlatformService.currentAccount })
      .on('transactionHash', (transactionHash) => {
        console.log(transactionHash);
        // this.nutsPlatformService.transactionSentSubject.next(transactionHash);

        // Records the transaction
        const depositTransaction = new TransactionModel(transactionHash, TransactionType.APPROVE, NotificationRole.MAKER,
          this.nutsPlatformService.currentAccount, this.nutsPlatformService.getInstrumentId(instrument), 0,
          {
            instrumentName: instrument,
            tokenName: token,
            tokenAddress,
            amount: `${amount}`,
          }
        );
        this.notificationService.addTransaction(depositTransaction).subscribe(result => {
          console.log(result);
          // Note: Transaction Sent event is not sent until the transaction is recored in notification server!
          this.nutsPlatformService.transactionSentSubject.next(transactionHash);
        });
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
    return instrumentEscrowContract.methods.deposit().send({ from: this.nutsPlatformService.currentAccount, value: this.nutsPlatformService.web3.utils.toWei(`${amount}`, 'ether') })
      .on('transactionHash', (transactionHash) => {
        console.log(transactionHash);
        // this.nutsPlatformService.transactionSentSubject.next(transactionHash);

        // Records the transaction
        const depositTransaction = new TransactionModel(transactionHash, TransactionType.DEPOSIT, NotificationRole.MAKER,
          this.nutsPlatformService.currentAccount, this.nutsPlatformService.getInstrumentId(instrument), 0,
          {
            instrumentName: instrument,
            tokenName: 'ETH',
            tokenAddress: ETH_ADDRESS,
            amount: `${amount}`,
          }
        );
        this.notificationService.addTransaction(depositTransaction).subscribe(result => {
          console.log(result);
          // Note: Transaction Sent event is not sent until the transaction is recored in notification server!
          this.nutsPlatformService.transactionSentSubject.next(transactionHash);
        });
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
        const depositTransaction = new TransactionModel(transactionHash, TransactionType.DEPOSIT, NotificationRole.MAKER,
          this.nutsPlatformService.currentAccount, this.nutsPlatformService.getInstrumentId(instrument), 0,
          {
            instrumentName: instrument,
            tokenName: token,
            tokenAddress,
            amount: `${amount}`,
          }
        );
        this.notificationService.addTransaction(depositTransaction).subscribe(result => {
          console.log(result);
          // Note: Transaction Sent event is not sent until the transaction is recored in notification server!
          this.nutsPlatformService.transactionSentSubject.next(transactionHash);
        });
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
        const depositTransaction = new TransactionModel(transactionHash, TransactionType.WITHDRAW, NotificationRole.MAKER,
          this.nutsPlatformService.currentAccount, this.nutsPlatformService.getInstrumentId(instrument), 0,
          {
            instrumentName: instrument,
            tokenName: 'ETH',
            tokenAddress: ETH_ADDRESS,
            amount: `${amount}`,
          }
        );
        this.notificationService.addTransaction(depositTransaction).subscribe(result => {
          console.log(result);
          // Note: Transaction Sent event is not sent until the transaction is recored in notification server!
          this.nutsPlatformService.transactionSentSubject.next(transactionHash);
        });
      })
      .on('receipt', (receipt) => {
        console.log(receipt);
        this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
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
        const depositTransaction = new TransactionModel(transactionHash, TransactionType.WITHDRAW, NotificationRole.MAKER,
          this.nutsPlatformService.currentAccount, this.nutsPlatformService.getInstrumentId(instrument), 0,
          {
            instrumentName: instrument,
            tokenName: token,
            tokenAddress,
            amount: `${amount}`,
          }
        );
        this.notificationService.addTransaction(depositTransaction).subscribe(result => {
          console.log(result);
          // Note: Transaction Sent event is not sent until the transaction is recored in notification server!
          this.nutsPlatformService.transactionSentSubject.next(transactionHash);
        });
      })
      .on('receipt', (receipt) => {
        console.log(receipt);
        this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
      });
  }

public async getAccountTransactions(instrument: string): Promise<AccountTransaction[]> {
    if (!this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork]) {
      return [];
    }
    if (!this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform[instrument]) {
      return [];
    }
    const instrumentEscrowAddress = this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform[instrument].instrumentEscrow;
    const instrumentEscrowContract = new this.nutsPlatformService.web3.eth.Contract(InstrumentEscrow, instrumentEscrowAddress);
    const instrumentEscrowEvents = await instrumentEscrowContract.getPastEvents('allEvents', { fromBlock: 0, toBlock: 'latest' });
    const transactions: AccountTransaction[] = [];
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

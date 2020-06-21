import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../notification/notification.service';
import { TransactionModel, TransactionType, NotificationRole } from '../notification/transaction.model';
import { IPO_SUBSCRIPTION_NAME, FSP_NAME, NutsPlatformService } from '../common/web3/nuts-platform.service';
import { Subject } from 'rxjs';
import * as isEqual from 'lodash.isequal';
import { TokenService } from '../common/token/token.service';
import { TokenModel } from '../common/token/token.model';

const APPROVE_AMOUNT = '115792089237316200000000000000000000000000000000000000000000';

export interface AccountTransaction {
  action: string,
  token: TokenModel,
  amount: number,
  transactionHash: string,
  blockNumber: number,
}

// Key: token address, value: token balance
export interface AccountBalance {
  [key: string]: string
}

// Key: instrument id, value: account balance
export interface AccountsBalance {
  [key: number]: AccountBalance
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  public accountsBalance: AccountsBalance = {};
  public accountsBalanceSubject: Subject<number> = new Subject();

  constructor(private nutsPlatformService: NutsPlatformService, private notificationService: NotificationService,
    private tokenService: TokenService, private http: HttpClient) {
    this.getUserBalanceFromBackend();
    this.nutsPlatformService.platformInitializedSubject.subscribe(initialized => {
      if (!initialized) return;
      console.log('Platform initialized. Reloading lending issuances.');
      this.getUserBalanceFromBackend();
    });

    this.nutsPlatformService.currentNetworkSubject.subscribe(_ => {
      this.getUserBalanceFromBackend();
    });
    this.nutsPlatformService.currentAccountSubject.subscribe(_ => {
      this.getUserBalanceFromBackend();
    });
    // Reloads account every 20s.
    setInterval(this.getUserBalanceFromBackend.bind(this), 20000);
  }

  getUserBalanceFromBackend(times: number = 1, interval: number = 1000) {
    const currentAddress = this.nutsPlatformService.currentAccount;
    if (!this.nutsPlatformService.isFullyLoaded()) {
      console.log('Either network or account is not loaded.');
      return;
    }

    let count = 0;
    const instrumentId = this.nutsPlatformService.getInstrumentId(IPO_SUBSCRIPTION_NAME);
    let intervalId = setInterval(() => {
      console.log('Loading account balance. Time = ' + count);
      this.http.get<AccountBalance>(`${this.nutsPlatformService.getApiServerHost()}/instruments/${instrumentId}/balance`, { params: { user: currentAddress } }).subscribe(accountBalance => {
        // Update user balance if there is any change
        if (!isEqual(accountBalance, this.accountsBalance[instrumentId])) {
          console.log('Account balanes updated.');
          this.accountsBalance[instrumentId] = accountBalance;
          this.accountsBalanceSubject.next(instrumentId);
        }
      });
      if (++count >= times) clearInterval(intervalId);
    }, interval);
  }

  public getAccountBalance(instrument: string, tokenAddress: string): string {
    const tokenAddressLowercase = tokenAddress.toLowerCase();
    const instrumentId = this.nutsPlatformService.getInstrumentId(instrument);
    return this.accountsBalance[instrumentId] && this.accountsBalance[instrumentId][tokenAddressLowercase] ?
      this.accountsBalance[instrumentId][tokenAddressLowercase] : '0';
  }

  public approve(instrument: string, tokenAddress: string) {
    const instrumentEscrowAddress = this.nutsPlatformService.getInstrumentEscrowAddress(instrument);
    const tokenContract = this.nutsPlatformService.getERC20TokenContract(tokenAddress);

    return tokenContract.methods.approve(instrumentEscrowAddress, APPROVE_AMOUNT).send({ from: this.nutsPlatformService.currentAccount })
      .on('transactionHash', (transactionHash) => {
        // Records the transaction
        const depositTransaction = new TransactionModel(transactionHash, TransactionType.APPROVE, NotificationRole.MAKER,
          this.nutsPlatformService.currentAccount, 0, { fspName: FSP_NAME, tokenAddress });
        this.notificationService.addTransaction(instrument, depositTransaction).subscribe(result => {
          // Note: Transaction Sent event is not sent until the transaction is recored in notification server!
          this.nutsPlatformService.transactionSentSubject.next(transactionHash);
        });
      })
      .on('receipt', (receipt) => {
        console.log('Approve receipt', receipt);
        this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
      });;
  }

  public depositETH(instrument: string, amount: string) {
    const instrumentEscrowContract = this.nutsPlatformService.getInstrumentEscrowContract(instrument);
    return instrumentEscrowContract.methods.deposit().send({ from: this.nutsPlatformService.currentAccount, value: amount })
      .on('transactionHash', (transactionHash) => {
        // Records the transaction
        const depositTransaction = new TransactionModel(transactionHash, TransactionType.DEPOSIT, NotificationRole.MAKER,
          this.nutsPlatformService.currentAccount, 0, { tokenAddress: this.nutsPlatformService.getWETH(), amount });
        this.notificationService.addTransaction(instrument, depositTransaction).subscribe(result => {
          // Note: Transaction Sent event is not sent until the transaction is recored in notification server!
          this.nutsPlatformService.transactionSentSubject.next(transactionHash);
        });
      })
      .on('receipt', (receipt) => {
        console.log('Deposit ETH receipt', receipt);
        this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
      });;
  }

  public depositToken(instrument: string, tokenAddress: string, amount: string) {
    const instrumentEscrowContract = this.nutsPlatformService.getInstrumentEscrowContract(instrument);
    return instrumentEscrowContract.methods.depositToken(tokenAddress, amount).send({ from: this.nutsPlatformService.currentAccount })
      .on('transactionHash', (transactionHash) => {
        // Records the transaction
        const depositTransaction = new TransactionModel(transactionHash, TransactionType.DEPOSIT, NotificationRole.MAKER,
          this.nutsPlatformService.currentAccount, 0, { tokenAddress, amount });
        this.notificationService.addTransaction(instrument, depositTransaction).subscribe(result => {
          console.log(result);
          // Note: Transaction Sent event is not sent until the transaction is recored in notification server!
          this.nutsPlatformService.transactionSentSubject.next(transactionHash);
        });
      })
      .on('receipt', (receipt) => {
        console.log('Deposit token receipt', receipt);
        this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
      });;
  }

  public withdrawETH(instrument: string, amount: string) {
    const instrumentEscrowContract = this.nutsPlatformService.getInstrumentEscrowContract(instrument);
    return instrumentEscrowContract.methods.withdraw(amount).send({ from: this.nutsPlatformService.currentAccount })
      .on('transactionHash', (transactionHash) => {
        // Records the transaction
        const depositTransaction = new TransactionModel(transactionHash, TransactionType.WITHDRAW, NotificationRole.MAKER,
          this.nutsPlatformService.currentAccount, 0, { tokenAddress: this.nutsPlatformService.getWETH(), amount });
        this.notificationService.addTransaction(instrument, depositTransaction).subscribe(result => {
          // Note: Transaction Sent event is not sent until the transaction is recored in notification server!
          this.nutsPlatformService.transactionSentSubject.next(transactionHash);
        });
      })
      .on('receipt', (receipt) => {
        console.log('Withdraw ETH receipt', receipt);
        this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
      });
  }

  public withdrawToken(instrument: string, tokenAddress: string, amount: string) {
    const instrumentEscrowContract = this.nutsPlatformService.getInstrumentEscrowContract(instrument);
    return instrumentEscrowContract.methods.withdrawToken(tokenAddress, amount).send({ from: this.nutsPlatformService.currentAccount })
      .on('transactionHash', (transactionHash) => {
        // Records the transaction
        const depositTransaction = new TransactionModel(transactionHash, TransactionType.WITHDRAW, NotificationRole.MAKER,
          this.nutsPlatformService.currentAccount, 0, { tokenAddress, amount });
        this.notificationService.addTransaction(instrument, depositTransaction).subscribe(result => {
          // Note: Transaction Sent event is not sent until the transaction is recored in notification server!
          this.nutsPlatformService.transactionSentSubject.next(transactionHash);
        });
      })
      .on('receipt', (receipt) => {
        console.log('Withdraw token receipt', receipt);
        this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
      });
  }

  public async getAccountTransactions(instrument: string): Promise<AccountTransaction[]> {
    const instrumentEscrowContract = this.nutsPlatformService.getInstrumentEscrowContract(instrument);
    const instrumentEscrowEvents = await instrumentEscrowContract.getPastEvents('allEvents', { fromBlock: 0, toBlock: 'latest' });
    const transactions: AccountTransaction[] = [];
    const currentAddress = this.nutsPlatformService.currentAccount.toLowerCase();
    const wethToken = this.tokenService.getTokenByAddress(this.nutsPlatformService.getWETH());
    instrumentEscrowEvents.forEach((escrowEvent) => {
      if (escrowEvent.event === 'Deposited' && escrowEvent.returnValues.depositer.toLowerCase() === currentAddress) {
        transactions.push({
          action: 'deposit',
          token: wethToken,
          amount: escrowEvent.returnValues.amount,
          transactionHash: escrowEvent.transactionHash,
          blockNumber: escrowEvent.blockNumber,
        });
      } else if (escrowEvent.event === 'Withdrawn' && escrowEvent.returnValues.withdrawer.toLowerCase() === currentAddress) {
        transactions.push({
          action: 'withdraw',
          token: wethToken,
          amount: escrowEvent.returnValues.amount,
          transactionHash: escrowEvent.transactionHash,
          blockNumber: escrowEvent.blockNumber,
        });
      } else if (escrowEvent.event === 'TokenDeposited' && escrowEvent.returnValues.depositer.toLowerCase() === currentAddress) {
        const token = this.tokenService.getTokenByAddress(escrowEvent.returnValues.token);
        if (!token) return;
        transactions.push({
          action: 'deposit',
          token: token,
          amount: escrowEvent.returnValues.amount,
          transactionHash: escrowEvent.transactionHash,
          blockNumber: escrowEvent.blockNumber,
        });
      } else if (escrowEvent.event === 'TokenWithdrawn' && escrowEvent.returnValues.withdrawer.toLowerCase() === currentAddress) {
        const token = this.tokenService.getTokenByAddress(escrowEvent.returnValues.token);
        if (!token) return;
        transactions.push({
          action: 'withdraw',
          token: token,
          amount: escrowEvent.returnValues.amount,
          transactionHash: escrowEvent.transactionHash,
          blockNumber: escrowEvent.blockNumber,
        });
      }
    });
    return transactions.sort((e1, e2) => e1.blockNumber - e2.blockNumber);;
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LendingData, BorrowingData, SwapData } from 'nuts-platform-protobuf-messages';
import { NutsPlatformService, ETH_ADDRESS, CUSTODIAN_ADDRESS } from './nuts-platform.service';
import { NotificationService } from 'src/app/notification/notification.service';
import { TransactionModel, TransactionType, NotificationRole } from 'src/app/notification/transaction.model';
import { LendingIssuanceModel } from '../model/lending-issuance.model';
import { Subject } from 'rxjs';
import { IssuanceModel } from '../model/issuance.model';
import { LendingMakerParameterModel } from '../model/lending-maker-parameter.model';
import { BorrowingMakerParameterModel } from '../model/borrowing-maker-parameter.model';
import { BorrowingIssuanceModel } from '../model/borrowing-issuance.model';
import { SwapMakerParameterModel } from '../model/swap-maker-parameter.model';
import { SwapIssuanceModel } from '../model/swap-issuance.model';

const InstrumentManager = require('./abi/InstrumentManagerInterface.json');

const INTEREST_RATE_DECIMALS = 10000;
const COLLATERAL_RATIO_DECIMALS = 100;

export interface IssuanceTransfer {
  action: string,
  fromWallet: string,
  fromRole: string,
  toWallet: string,
  toRole: string,
  token: string,
  amount: number,
  blockNumber: number,
}

@Injectable({
  providedIn: 'root'
})
export class InstrumentService {
  public lendingIssuances: LendingIssuanceModel[] = [];
  public lendingIssuancesUpdatedSubject = new Subject<LendingIssuanceModel[]>();
  public borrowingIssuances: BorrowingIssuanceModel[] = [];
  public borrowingIssuancesUpdatedSubject = new Subject<BorrowingIssuanceModel[]>();
  public swapIssuances: SwapIssuanceModel[] = [];
  public swapIssuancesUpdatedSubject = new Subject<SwapIssuanceModel[]>();

  constructor(private nutsPlatformService: NutsPlatformService, private notificationService: NotificationService,
    private http: HttpClient) {
    // We don't initialize the lending issuance list until the platform is initialized!
    this.nutsPlatformService.platformInitializedSubject.subscribe(initialized => {
      if (initialized) {
        console.log('Instrument initialized', initialized);
        this.reloadIssuances();
        this.nutsPlatformService.currentNetworkSubject.subscribe(currentNetwork => {
          console.log('Network changed. Reloading lending issuances.', currentNetwork);
          this.reloadIssuances();
        });

        // Reloads issuances every 30s.
        setTimeout(this.reloadIssuances.bind(this), 30000);
      }
    });
  }

  public createLendingIssuance(principalToken: string, principalAmount: number, collateralToken: string,
    collateralRatio: number, tenor: number, interestRate: number) {

    const principalTokenAddress = this.nutsPlatformService.getTokenAddressByName(principalToken);
    const collateralTokenAddress = this.nutsPlatformService.getTokenAddressByName(collateralToken);

    const lendingMakerParametersModel = new LendingMakerParameterModel(collateralTokenAddress, principalTokenAddress, principalAmount,
      Math.floor(collateralRatio * COLLATERAL_RATIO_DECIMALS), tenor, Math.floor(interestRate * INTEREST_RATE_DECIMALS));
    const message = lendingMakerParametersModel.toMessage().serializeBinary();
    const lendingMakerParameters = '0x' + Buffer.from(message).toString('hex');
    console.log(lendingMakerParameters);

    const instrumentManagerAddress = this.nutsPlatformService.getInstrumentManager('lending');
    const instrumentManagerContract = new this.nutsPlatformService.web3.eth.Contract(InstrumentManager, instrumentManagerAddress);
    return instrumentManagerContract.methods.createIssuance(lendingMakerParameters).send({ from: this.nutsPlatformService.currentAccount, gas: 6721975 })
      .on('transactionHash', (transactionHash) => {
        // Records the transaction
        const depositTransaction = new TransactionModel(transactionHash, TransactionType.CREATE_OFFER, NotificationRole.MAKER,
          this.nutsPlatformService.currentAccount, this.nutsPlatformService.getInstrumentId('lending'), 0,
          {
            principalTokenName: principalToken,
            principalTokenAddress,
            principalAmount: `${principalAmount}`,
            collateralTokenName: collateralToken,
            collateralTokenAddress,
            collateralRatio: `${collateralRatio}`,
            tenor: `${tenor}`,
            interestRate: `${interestRate}`,

            // instrumentName: instrument,
            // tokenName: token,
            // tokenAddress,
            // amount: `${amount}`,
          }
        );
        this.notificationService.addTransaction(depositTransaction).subscribe(result => {
          console.log(result);
          // Note: Transaction Sent event is not sent until the transaction is recored in notification server!
          this.nutsPlatformService.transactionSentSubject.next(transactionHash);
        });
      });
  }

  public createBorrowingIssuance(principalToken: string, principalAmount: number, collateralToken: string,
    collateralRatio: number, tenor: number, interestRate: number) {

    const principalTokenAddress = this.nutsPlatformService.getTokenAddressByName(principalToken);
    const collateralTokenAddress = this.nutsPlatformService.getTokenAddressByName(collateralToken);
 
    const borrowingMakerParametersModel = new BorrowingMakerParameterModel(collateralTokenAddress, principalTokenAddress, principalAmount,
      Math.floor(collateralRatio * COLLATERAL_RATIO_DECIMALS), tenor, Math.floor(interestRate * INTEREST_RATE_DECIMALS));
    const message = borrowingMakerParametersModel.toMessage().serializeBinary();
    const borrowingMakerParameters = '0x' + Buffer.from(message).toString('hex');
    console.log(borrowingMakerParameters);

    const instrumentManagerAddress = this.nutsPlatformService.getInstrumentManager('borrowing');
    const instrumentManagerContract = new this.nutsPlatformService.web3.eth.Contract(InstrumentManager, instrumentManagerAddress);
    return instrumentManagerContract.methods.createIssuance(borrowingMakerParameters).send({ from: this.nutsPlatformService.currentAccount, gas: 6721975 })
      .on('transactionHash', (transactionHash) => {
        console.log(transactionHash);
        // this.nutsPlatformService.transactionSentSubject.next(transactionHash);
        // Records the transaction
        const depositTransaction = new TransactionModel(transactionHash, TransactionType.CREATE_OFFER, NotificationRole.MAKER,
          this.nutsPlatformService.currentAccount, this.nutsPlatformService.getInstrumentId('borrowing'), 0,
          {
            principalTokenName: principalToken,
            principalTokenAddress,
            principalAmount: `${principalAmount}`,
            collateralTokenName: collateralToken,
            collateralTokenAddress,
            collateralRatio: `${collateralRatio}`,
            tenor: `${tenor}`,
            interestRate: `${interestRate}`,
          }
        );
        this.notificationService.addTransaction(depositTransaction).subscribe(result => {
          console.log(result);
          // Note: Transaction Sent event is not sent until the transaction is recored in notification server!
          this.nutsPlatformService.transactionSentSubject.next(transactionHash);
        });
      });
  }

  public createSwapIssuance(inputToken: string, outputToken: string, inputAmount: number, outputAmount: number,
    duration: number) {
  
    const inputTokenAddress = this.nutsPlatformService.getTokenAddressByName(inputToken);
    const outputTokenAddress = this.nutsPlatformService.getTokenAddressByName(outputToken);
    console.log(inputTokenAddress, outputTokenAddress);

    const swapMakerParametersModel = new SwapMakerParameterModel(inputTokenAddress, outputTokenAddress, inputAmount, outputAmount, duration);
    const message = swapMakerParametersModel.toMessage().serializeBinary();
    const swapMakerParameters = '0x' + Buffer.from(message).toString('hex');
    console.log(swapMakerParameters);

    const instrumentManagerAddress = this.nutsPlatformService.getInstrumentManager('swap');
    const instrumentManagerContract = new this.nutsPlatformService.web3.eth.Contract(InstrumentManager, instrumentManagerAddress);
    return instrumentManagerContract.methods.createIssuance(swapMakerParameters).send({ from: this.nutsPlatformService.currentAccount, gas: 6721975 })
      .on('transactionHash', (transactionHash) => {
        // Records the transaction
        const depositTransaction = new TransactionModel(transactionHash, TransactionType.CREATE_OFFER, NotificationRole.MAKER,
          this.nutsPlatformService.currentAccount, this.nutsPlatformService.getInstrumentId('swap'), 0,
          {
            inputTokenName: inputToken,
            inputTokenAddress,
            outputTokenName: outputToken,
            outputTokenAddress,
            inputAmount: `${inputAmount}`,
            outputAmount: `${outputAmount}`,
            duration: `${duration}`,
          }
        );
        this.notificationService.addTransaction(depositTransaction).subscribe(result => {
          console.log(result);
          // Note: Transaction Sent event is not sent until the transaction is recored in notification server!
          this.nutsPlatformService.transactionSentSubject.next(transactionHash);
        });
      });
  }

  public engageIssuance(instrument: string, issuanceId: number) {

    const instrumentManagerAddress = this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform[instrument].instrumentManager;
    const instrumentManagerContract = new this.nutsPlatformService.web3.eth.Contract(InstrumentManager, instrumentManagerAddress);
    return instrumentManagerContract.methods.engageIssuance(issuanceId, this.nutsPlatformService.web3.utils.fromAscii("")).send({ from: this.nutsPlatformService.currentAccount, gas: 6721975 })
      .on('transactionHash', (transactionHash) => {
        console.log(transactionHash);
        // this.nutsPlatformService.transactionSentSubject.next(transactionHash);

        // Records the transaction
        const depositTransaction = new TransactionModel(transactionHash, TransactionType.ACCEPT_OFFER, NotificationRole.TAKER,
          this.nutsPlatformService.currentAccount, this.nutsPlatformService.getInstrumentId(instrument), issuanceId, {});
        this.notificationService.addTransaction(depositTransaction).subscribe(result => {
          console.log(result);
          // Note: Transaction Sent event is not sent until the transaction is recored in notification server!
          this.nutsPlatformService.transactionSentSubject.next(transactionHash);
        });
      });
  }

  public repayIssuance(instrument: string, issuanceId: number, tokenAddress: string, amount: number) {

    const instrumentManagerAddress = this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform[instrument].instrumentManager;
    const instrumentManagerContract = new this.nutsPlatformService.web3.eth.Contract(InstrumentManager, instrumentManagerAddress);
    const totalAmount = tokenAddress.toLowerCase() === ETH_ADDRESS.toLowerCase() ? this.nutsPlatformService.web3.utils.toWei(`${amount}`, 'ether') : amount;

    // return instrumentManagerContract.methods.depositToIssuance(issuanceId, tokenAddress, totalAmount).send({ from: this.nutsPlatformService.currentAccount, gas: 6721975 })
    return instrumentManagerContract.methods.notifyCustomEvent(issuanceId, this.nutsPlatformService.web3.utils.fromAscii("repay_full"),
      this.nutsPlatformService.web3.utils.fromAscii("")).send({ from: this.nutsPlatformService.currentAccount, gas: 6721975 })
      .on('transactionHash', (transactionHash) => {
        console.log(transactionHash);
        // this.nutsPlatformService.transactionSentSubject.next(transactionHash);

        // Records the transaction
        const depositTransaction = new TransactionModel(transactionHash, TransactionType.PAY_OFFER, NotificationRole.TAKER,
          this.nutsPlatformService.currentAccount, this.nutsPlatformService.getInstrumentId(instrument), issuanceId,
          {
            principalTokenName: this.nutsPlatformService.getTokenNameByAddress(tokenAddress),
            principalTokenAddress: tokenAddress,
            totalAmount: `${totalAmount}`,
          }
        );
        this.notificationService.addTransaction(depositTransaction).subscribe(result => {
          console.log(result);
          // Note: Transaction Sent event is not sent until the transaction is recored in notification server!
          this.nutsPlatformService.transactionSentSubject.next(transactionHash);
        });
      });
  }

  public cancelIssuance(instrument: string, issuanceId: number) {

    const instrumentManagerAddress = this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform[instrument].instrumentManager;
    const instrumentManagerContract = new this.nutsPlatformService.web3.eth.Contract(InstrumentManager, instrumentManagerAddress);
    return instrumentManagerContract.methods.notifyCustomEvent(issuanceId, this.nutsPlatformService.web3.utils.fromAscii("cancel_issuance"),
      this.nutsPlatformService.web3.utils.fromAscii("")).send({ from: this.nutsPlatformService.currentAccount, gas: 6721975 })
      .on('transactionHash', (transactionHash) => {
        console.log(transactionHash);
        // this.nutsPlatformService.transactionSentSubject.next(transactionHash);

        // Records the transaction
        const depositTransaction = new TransactionModel(transactionHash, TransactionType.CANCEL_OFFER, NotificationRole.MAKER,
          this.nutsPlatformService.currentAccount, this.nutsPlatformService.getInstrumentId(instrument), issuanceId, {});
        this.notificationService.addTransaction(depositTransaction).subscribe(result => {
          console.log(result);
          // Note: Transaction Sent event is not sent until the transaction is recored in notification server!
          this.nutsPlatformService.transactionSentSubject.next(transactionHash);
        });
      });
  }

  public async reloadLendingIssuances() {
    console.log('Reloading lending issuances.');
    this.http.get<LendingIssuanceModel[]>(`${this.nutsPlatformService.getApiServerHost()}/query/issuance`, {
      params: {
        instrument_id: `${this.nutsPlatformService.getInstrumentId('lending')}`,
      }
    }).subscribe(lendingIssuances => {
      this.lendingIssuances = lendingIssuances.map(issuance => LendingIssuanceModel.fromObject(issuance));
      this.lendingIssuancesUpdatedSubject.next(this.lendingIssuances);
    });

    // const instrumentManagerAddress = this.nutsPlatformService.getInstrumentManager('lending');
    // const instrumentManagerContract = new this.nutsPlatformService.web3.eth.Contract(InstrumentManager, instrumentManagerAddress);
    // const issuanceCount = await instrumentManagerContract.methods.getLastIssuanceId().call({ from: this.nutsPlatformService.currentAccount });
    // console.log('Lending issuance count', issuanceCount);

    // this.lendingIssuances = [];
    // for (let i = 1; i <= issuanceCount; i++) {
    //   const lendingDate = await instrumentManagerContract.methods.getCustomData(i, this.nutsPlatformService.web3.utils.fromAscii("lending_data")).call();
    //   const lendingCompleteProperties = LendingData.LendingCompleteProperties.deserializeBinary(Uint8Array.from(Buffer.from(lendingDate.substring(2), 'hex')));
    //   this.lendingIssuances.push(LendingIssuanceModel.fromMessage(lendingCompleteProperties));
    // }

    // this.lendingIssuancesUpdatedSubject.next(this.lendingIssuances);
    // console.log('Lending issuance updated', 'request', issuanceCount, 'response', this.lendingIssuances.length);
  }

  public async reloadBorrowingIssuances() {
    console.log('Reloading borrowing issuances.');
    this.http.get<BorrowingIssuanceModel[]>(`${this.nutsPlatformService.getApiServerHost()}/query/issuance`, {
      params: {
        instrument_id: `${this.nutsPlatformService.getInstrumentId('borrowing')}`,
      }
    }).subscribe(borrowingIssuances => {
      this.borrowingIssuances = borrowingIssuances.map(issuance => BorrowingIssuanceModel.fromObject(issuance));
      this.borrowingIssuancesUpdatedSubject.next(this.borrowingIssuances);
    });

    // const instrumentManagerAddress = this.nutsPlatformService.getInstrumentManager('borrowing');
    // const instrumentManagerContract = new this.nutsPlatformService.web3.eth.Contract(InstrumentManager, instrumentManagerAddress);
    // const issuanceCount = await instrumentManagerContract.methods.getLastIssuanceId().call({ from: this.nutsPlatformService.currentAccount });
    // console.log('Borrowing issuance count', issuanceCount);

    // this.borrowingIssuances = [];
    // for (let i = 1; i <= issuanceCount; i++) {
    //   const borrowingData = await instrumentManagerContract.methods.getCustomData(i, this.nutsPlatformService.web3.utils.fromAscii("borrowing_data")).call();
    //   const borrowingCompleteProperties = BorrowingData.BorrowingCompleteProperties.deserializeBinary(Uint8Array.from(Buffer.from(borrowingData.substring(2), 'hex')));
    //   this.borrowingIssuances.push(BorrowingIssuanceModel.fromMessage(borrowingCompleteProperties));
    // }

    // this.borrowingIssuancesUpdatedSubject.next(this.borrowingIssuances);
    // console.log('Borrowing issuance updated', 'request', issuanceCount, 'response', this.borrowingIssuances.length);
  }

  public async reloadSwapIssuances() {
    console.log('Reloading swap issuances.');
    this.http.get<SwapIssuanceModel[]>(`${this.nutsPlatformService.getApiServerHost()}/query/issuance`, {
      params: {
        instrument_id: `${this.nutsPlatformService.getInstrumentId('swap')}`,
      }
    }).subscribe(swapIssuances => {
      this.swapIssuances = swapIssuances.map(issuance => SwapIssuanceModel.fromObject(issuance));
      this.swapIssuancesUpdatedSubject.next(this.swapIssuances);
    });

    // const instrumentManagerAddress = this.nutsPlatformService.getInstrumentManager('swap');
    // const instrumentManagerContract = new this.nutsPlatformService.web3.eth.Contract(InstrumentManager, instrumentManagerAddress);
    // const issuanceCount = await instrumentManagerContract.methods.getLastIssuanceId().call({ from: this.nutsPlatformService.currentAccount });
    // console.log('Swap issuance count', issuanceCount);

    // this.swapIssuances = [];
    // for (let i = 1; i <= issuanceCount; i++) {
    //   const swapData = await instrumentManagerContract.methods.getCustomData(i, this.nutsPlatformService.web3.utils.fromAscii("swap_data")).call();
    //   const swapCompleteProperties = SwapData.SpotSwapCompleteProperties.deserializeBinary(Uint8Array.from(Buffer.from(swapData.substring(2), 'hex')));
    //   this.swapIssuances.push(SwapIssuanceModel.fromMessage(swapCompleteProperties));
    // }

    // this.swapIssuancesUpdatedSubject.next(this.swapIssuances);
    // console.log('Swap issuance updated', 'request', issuanceCount, 'response', this.swapIssuances.length);
  }

  public async reloadIssuances() {
    await this.reloadLendingIssuances();
    await this.reloadBorrowingIssuances();
    await this.reloadSwapIssuances();
  }

  public getLendingIssuanceById(issuanceId: number): LendingIssuanceModel {
    return this.lendingIssuances.find(issuance => issuance.issuanceId === issuanceId);
  }

  public getBorrowingIssuanceById(issuanceId: number): BorrowingIssuanceModel {
    return this.borrowingIssuances.find(issuance => issuance.issuanceId === issuanceId);
  }

  public getSwapIssuanceById(issuanceId: number): SwapIssuanceModel {
    return this.swapIssuances.find(issuance => issuance.issuanceId === issuanceId);
  }

  public async getIssuanceTransfers(instrument: string, issuance: IssuanceModel): Promise<IssuanceTransfer[]> {
    const instrumentManagerAddress = this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform[instrument].instrumentManager;
    const instrumentManagerContract = new this.nutsPlatformService.web3.eth.Contract(InstrumentManager, instrumentManagerAddress);
    const tokenTransferEvents = await instrumentManagerContract.getPastEvents('TokenTransferred', { fromBlock: 0, toBlock: 'latest' });
    const transactions: IssuanceTransfer[] = [];
    tokenTransferEvents.forEach((event) => {
      if (event.returnValues.issuanceId == issuance.issuanceId) {
        console.log(event);
        const [fromWallet, toWallet] = this.getTransactionWallet(event.returnValues.transferType, issuance);
        transactions.push({
          action: this.nutsPlatformService.web3.utils.toAscii(event.returnValues.action),
          fromWallet: fromWallet,
          fromRole: this.getTransactionRole(event.returnValues.fromAddress, issuance),
          toWallet: toWallet,
          toRole: this.getTransactionRole(event.returnValues.toAddress, issuance),
          token: this.nutsPlatformService.getTokenNameByAddress(event.returnValues.tokenAddress),
          amount: event.returnValues.amount,
          blockNumber: event.blockNumber,
        });
      }
    });
    return transactions.sort((e1, e2) => e1.blockNumber - e2.blockNumber);;
  }

  private getTransactionWallet(transferType: string, issuance: IssuanceModel): [string, string] {
    switch (transferType) {
      case "1":     // Inbound transfer
        return ["A/C", "Position"];
      case "2":     // Outbound transfer
        return ["Position", "A/C"];
      case "3":
        return ["Position", "Position"];
      default:
        return ["Unknown", "Unknown"];
    }
  }

  private getTransactionRole(address: string, issuance: IssuanceModel): string {
    switch (address.toLowerCase()) {
      case issuance.makerAddress:
        return "Maker";
      case issuance.takerAddress:
        return "Taker";
      case CUSTODIAN_ADDRESS.toLowerCase():
        return "Custodian";
      default:
        return 'N/A';
    }
  }
}

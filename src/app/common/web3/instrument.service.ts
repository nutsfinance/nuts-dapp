import { Injectable } from '@angular/core';
import { LendingData } from 'nuts-platform-protobuf-messages';
import { NutsPlatformService, ETH_ADDRESS } from './nuts-platform.service';
import { NotificationService } from 'src/app/notification/notification.service';
import { TransactionModel, TransactionType, NotificationRole } from 'src/app/notification/transaction.model';
import { LendingIssuanceModel } from '../model/lending-issuance.model';
import { Subject } from 'rxjs';
import { LendingMakerParameterModel } from '../model/lending-maker-parameter.model';

const InstrumentManager = require('./abi/InstrumentManagerInterface.json');

const INTEREST_RATE_DECIMALS = 10000;
const COLLATERAL_RATIO_DECIMALS = 100;

@Injectable({
  providedIn: 'root'
})
export class InstrumentService {
  public lendingIssuances: LendingIssuanceModel[] = [];
  public lendingIssuancesUpdatedSubject = new Subject<LendingIssuanceModel[]>();

  constructor(private nutsPlatformService: NutsPlatformService, private notificationService: NotificationService) {
    this.reloadLendingIssuances();
    this.nutsPlatformService.currentNetworkSubject.subscribe(currentNetwork => {
      console.log('Network changed. Reloading lending issuances.', currentNetwork);
      this.reloadLendingIssuances();
    });
    // Reloads issuances every 60s.
    setTimeout(this.reloadLendingIssuances.bind(this), 60000);
  }

  public createLendingIssuance(principalToken: string, principalAmount: number, collateralToken: string,
    collateralRatio: number, tenor: number, interestRate: number) {
    if (!this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork]) {
      alert(`Network ${this.nutsPlatformService.currentNetwork} is not supported!`);
      return;
    }
    if (!this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform.lending) {
      alert(`Instrument lending is not supported!`);
      return;
    }
    if (principalToken !== 'ETH' && !this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].tokens[principalToken]) {
      alert(`Token ${principalToken} is not supported!`);
      return;
    }
    if (collateralToken !== 'ETH' && !this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].tokens[collateralToken]) {
      alert(`Token ${collateralToken} is not supported!`);
      return;
    }

    const principalTokenAddress = principalToken === 'ETH' ? ETH_ADDRESS : this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].tokens[principalToken];
    const lendingAmount = principalToken === 'ETH' ? this.nutsPlatformService.web3.utils.toWei(principalAmount, 'ether') : principalAmount;
    const collateralTokenAddress = collateralToken === 'ETH' ? ETH_ADDRESS : this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].tokens[collateralToken];
    console.log(collateralTokenAddress, principalTokenAddress, lendingAmount,
      collateralRatio * COLLATERAL_RATIO_DECIMALS, tenor, interestRate * INTEREST_RATE_DECIMALS);
    // const lendingParameters = await parametersUtilContract.methods.getLendingMakerParameters(collateralTokenAddress, principalTokenAddress, lendingAmount,
    //   collateralRatio * COLLATERAL_RATIO_DECIMALS, tenor, interestRate * INTEREST_RATE_DECIMALS).call({ from: this.nutsPlatformService.currentAccount });
    // console.log(lendingParameters);

    const lendingMakerParametersModel = new LendingMakerParameterModel(collateralTokenAddress, principalTokenAddress, lendingAmount,
      collateralRatio * COLLATERAL_RATIO_DECIMALS, tenor, interestRate * INTEREST_RATE_DECIMALS);
    const message = lendingMakerParametersModel.toMessage().serializeBinary();
    const lendingMakerParameters = '0x' + Buffer.from(message).toString('hex');
    console.log(lendingMakerParameters);

    const instrumentManagerAddress = this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform.lending.instrumentManager;
    const instrumentManagerContract = new this.nutsPlatformService.web3.eth.Contract(InstrumentManager, instrumentManagerAddress);
    return instrumentManagerContract.methods.createIssuance(lendingMakerParameters).send({ from: this.nutsPlatformService.currentAccount, gas: 6721975 })
      .on('transactionHash', (transactionHash) => {
        console.log(transactionHash);
        // this.nutsPlatformService.transactionSentSubject.next(transactionHash);
        // Records the transaction
        const depositTransaction = new TransactionModel(transactionHash, TransactionType.CREATE_OFFER, NotificationRole.MAKER,
          this.nutsPlatformService.currentAccount, this.nutsPlatformService.getInstrumentId('lending'), 0,
          {
            principalTokenName: principalToken,
            principalTokenAddress,
            principalAmount: `${lendingAmount}`,
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

      })
      .on('receipt', (receipt) => {
        console.log(receipt);
        this.reloadIssuances('lending');
        this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
      });
  }

  public engageIssuance(instrument: string, issuanceId: number) {
    if (!this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork]) {
      alert(`Network ${this.nutsPlatformService.currentNetwork} is not supported!`);
      return;
    }
    if (!this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform[instrument]) {
      alert(`Instrument ${instrument} is not supported!`);
      return;
    }

    const instrumentManagerAddress = this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform[instrument].instrumentManager;
    const instrumentManagerContract = new this.nutsPlatformService.web3.eth.Contract(InstrumentManager, instrumentManagerAddress);
    return instrumentManagerContract.methods.engageIssuance(issuanceId, this.nutsPlatformService.web3.utils.fromAscii("")).send({ from: this.nutsPlatformService.currentAccount, gas: 6721975 })
      .on('transactionHash', (transactionHash) => {
        console.log(transactionHash);
        // this.nutsPlatformService.transactionSentSubject.next(transactionHash);

        // Records the transaction
        const depositTransaction = new TransactionModel(transactionHash, TransactionType.ACCEPT_OFFER, NotificationRole.TAKER,
          this.nutsPlatformService.currentAccount, this.nutsPlatformService.getInstrumentId('lending'), issuanceId, {});
        this.notificationService.addTransaction(depositTransaction).subscribe(result => {
          console.log(result);
          // Note: Transaction Sent event is not sent until the transaction is recored in notification server!
          this.nutsPlatformService.transactionSentSubject.next(transactionHash);
        });
      })
      .on('receipt', (receipt) => {
        console.log(receipt);
        // Updates the issuance list.
        this.reloadIssuances(instrument);
        this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
      });
  }

  public repayIssuance(instrument: string, issuanceId: number, tokenAddress: string, amount: number) {
    if (!this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork]) {
      alert(`Network ${this.nutsPlatformService.currentNetwork} is not supported!`);
      return;
    }
    if (!this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform[instrument]) {
      alert(`Instrument ${instrument} is not supported!`);
      return;
    }

    const instrumentManagerAddress = this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform[instrument].instrumentManager;
    const instrumentManagerContract = new this.nutsPlatformService.web3.eth.Contract(InstrumentManager, instrumentManagerAddress);
    const totalAmount = tokenAddress.toLowerCase() === ETH_ADDRESS.toLowerCase() ? this.nutsPlatformService.web3.utils.toWei(`${amount}`, 'ether') : amount;
    return instrumentManagerContract.methods.depositToIssuance(issuanceId, tokenAddress, totalAmount).send({ from: this.nutsPlatformService.currentAccount, gas: 6721975 })
      .on('transactionHash', (transactionHash) => {
        console.log(transactionHash);
        // this.nutsPlatformService.transactionSentSubject.next(transactionHash);

        // Records the transaction
        const depositTransaction = new TransactionModel(transactionHash, TransactionType.PAY_OFFER,  NotificationRole.TAKER,
          this.nutsPlatformService.currentAccount, this.nutsPlatformService.getInstrumentId('lending'), issuanceId,
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
      })
      .on('receipt', (receipt) => {
        console.log(receipt);
        // Updates the issuance list.
        this.reloadIssuances(instrument);
        this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
      });
  }

  public cancelIssuance(instrument: string, issuanceId: number) {
    if (!this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork]) {
      alert(`Network ${this.nutsPlatformService.currentNetwork} is not supported!`);
      return;
    }
    if (!this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform[instrument]) {
      alert(`Instrument ${instrument} is not supported!`);
      return;
    }

    const instrumentManagerAddress = this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform[instrument].instrumentManager;
    const instrumentManagerContract = new this.nutsPlatformService.web3.eth.Contract(InstrumentManager, instrumentManagerAddress);
    return instrumentManagerContract.methods.notifyCustomEvent(issuanceId, this.nutsPlatformService.web3.utils.fromAscii("cancel_issuance"),
      this.nutsPlatformService.web3.utils.fromAscii("")).send({ from: this.nutsPlatformService.currentAccount, gas: 6721975 })
      .on('transactionHash', (transactionHash) => {
        console.log(transactionHash);
        // this.nutsPlatformService.transactionSentSubject.next(transactionHash);

        // Records the transaction
        const depositTransaction = new TransactionModel(transactionHash, TransactionType.CANCEL_OFFER, NotificationRole.MAKER,
          this.nutsPlatformService.currentAccount, this.nutsPlatformService.getInstrumentId('lending'), issuanceId, {});
        this.notificationService.addTransaction(depositTransaction).subscribe(result => {
          console.log(result);
          // Note: Transaction Sent event is not sent until the transaction is recored in notification server!
          this.nutsPlatformService.transactionSentSubject.next(transactionHash);
        });
      })
      .on('receipt', (receipt) => {
        console.log(receipt);
        // Updates the issuance list.
        this.reloadIssuances(instrument);
        this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
      });
  }

  public async reloadLendingIssuances() {
    console.log('Reloading lending issuances.');
    if (!this.nutsPlatformService.currentAccount || !this.nutsPlatformService.currentNetwork) {
      console.log('Either account or network is not set.');
    }
    if (!this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork]) {
      alert(`Network ${this.nutsPlatformService.currentNetwork} is not supported!`);
      return;
    }
    if (!this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform.lending) {
      alert(`Instrument lending is not supported!`);
      return;
    }
    const instrumentManagerAddress = this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform.lending.instrumentManager;
    const instrumentManagerContract = new this.nutsPlatformService.web3.eth.Contract(InstrumentManager, instrumentManagerAddress);
    const issuanceCount = await instrumentManagerContract.methods.getLastIssuanceId().call({ from: this.nutsPlatformService.currentAccount });
    console.log(issuanceCount);

    const batchedRequests = [];
    for (let i = 1; i <= issuanceCount; i++) {
      batchedRequests.push(instrumentManagerContract.methods.getCustomData(i, this.nutsPlatformService.web3.utils.fromAscii("lending_data")).call);
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

  public getLendingIssuance(issuanceId: number): LendingIssuanceModel {
    return this.lendingIssuances.find(issuance => issuance.issuanceId === issuanceId);
  }

  private makeBatchRequest(calls) {
    let batch = new this.nutsPlatformService.web3.BatchRequest();

    let promises = calls.map(call => {
      return new Promise((res, rej) => {
        let req = call.request({ from: this.nutsPlatformService.currentAccount }, (err, data) => {
          if (err) rej(err);
          else res(data)
        });
        batch.add(req)
      })
    })
    batch.execute();

    return Promise.all(promises);
  }

  private reloadIssuances(instrument: string) {
    switch(instrument) {
      case 'lending':
        this.reloadLendingIssuances();
        break;
    }
  }
}

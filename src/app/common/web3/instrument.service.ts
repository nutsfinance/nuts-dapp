import { Injectable } from '@angular/core';
import { LendingData } from 'nuts-platform-protobuf-messages';
import { NutsPlatformService, ETH_ADDRESS } from './nuts-platform.service';
import { NotificationService } from 'src/app/notification/notification.service';
import { TransactionModel, TransactionType } from 'src/app/notification/transaction.model';
import { LendingIssuanceModel } from '../model/lending-issuance.model';
import { Subject } from 'rxjs';

const InstrumentManager = require('./abi/InstrumentManagerInterface.json');
const ParametersUtil = require('./abi/ParametersUtil.json');

const INTEREST_RATE_DECIMALS = 10000;
const COLLATERAL_RATIO_DECIMALS = 100;

@Injectable({
  providedIn: 'root'
})
export class InstrumentService {
  public lendingIssuances: LendingIssuanceModel[] = [];
  public lendingIssuancesUpdatedSubject = new Subject<LendingIssuanceModel[]>();

  constructor(private nutsPlatformService: NutsPlatformService, private notificationService: NotificationService) { }

  public async createLendingIssuance(principalToken: string, principalAmount: number, collateralToken: string,
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
    const parametersUtilAddress = this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform.parametersUtil;
    const parametersUtilContract = new this.nutsPlatformService.web3.eth.Contract(ParametersUtil, parametersUtilAddress);

    const principalTokenAddress = principalToken === 'ETH' ? ETH_ADDRESS : this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].tokens[principalToken];
    const lendingAmount = principalToken === 'ETH' ? this.nutsPlatformService.web3.utils.toWei(principalAmount, 'ether') : principalAmount;
    const collateralTokenAddress = collateralToken === 'ETH' ? ETH_ADDRESS : this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].tokens[collateralToken];
    console.log(collateralTokenAddress, principalTokenAddress, lendingAmount,
      collateralRatio * COLLATERAL_RATIO_DECIMALS, tenor, interestRate * INTEREST_RATE_DECIMALS);
    const lendingParameters = await parametersUtilContract.methods.getLendingMakerParameters(collateralTokenAddress, principalTokenAddress, lendingAmount,
      collateralRatio * COLLATERAL_RATIO_DECIMALS, tenor, interestRate * INTEREST_RATE_DECIMALS).call({ from: this.nutsPlatformService.currentAccount });

    const instrumentManagerAddress = this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform.lending.instrumentManager;
    const instrumentManagerContract = new this.nutsPlatformService.web3.eth.Contract(InstrumentManager, instrumentManagerAddress);
    return instrumentManagerContract.methods.createIssuance(lendingParameters).send({ from: this.nutsPlatformService.currentAccount, gas: 6721975 })
      .on('transactionHash', (transactionHash) => {
        console.log(transactionHash);
        // this.nutsPlatformService.transactionSentSubject.next(transactionHash);
        // Records the transaction
        const depositTransaction = new TransactionModel(transactionHash, TransactionType.CREATE_OFFER,
          this.nutsPlatformService.currentAccount, this.nutsPlatformService.getInstrumentId('lending'),
          {
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
        this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
      });
  }

  public async engageIssuance(instrument: string, issuanceId: number) {
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
        this.nutsPlatformService.transactionSentSubject.next(transactionHash);
      })
      .on('receipt', (receipt) => {
        console.log(receipt);
        this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
      });
  }

  public async repayIssuance(instrument: string, issuanceId: number, tokenAddress: string, amount: number) {
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
    return instrumentManagerContract.methods.depositToIssuance(issuanceId, tokenAddress, amount).send({ from: this.nutsPlatformService.currentAccount, gas: 6721975 })
      .on('transactionHash', (transactionHash) => {
        console.log(transactionHash);
        this.nutsPlatformService.transactionSentSubject.next(transactionHash);
      })
      .on('receipt', (receipt) => {
        console.log(receipt);
        this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
      });
  }

  public async cancelIssuance(instrument: string, issuanceId: number) {
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
        this.nutsPlatformService.transactionSentSubject.next(transactionHash);
      })
      .on('receipt', (receipt) => {
        console.log(receipt);
        this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
      });
  }

  public async getLendingIssuances() {
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
}

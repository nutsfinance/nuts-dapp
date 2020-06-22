import { NutsPlatformService } from '../common/web3/nuts-platform.service';
import { NotificationService } from 'src/app/notification/notification.service';
import { TokenService } from '../common/token/token.service';
import { HttpClient } from '@angular/common/http';
import { IssuanceModel, IssuanceState, EngagementState } from './issuance.model';
import { TransactionModel, TransactionType, NotificationRole } from '../notification/transaction.model';
import { TokenModel } from '../common/token/token.model';
import { PriceOracleService } from '../common/web3/price-oracle.service';

const CANCEL_ISSUANCE_EVENT = "cancel_issuance";
const REPAY_ISSUANCE_EVENT = "repay_full";

/**
 * Base class for instrument services.
 */
export class InstrumentService {
  constructor(protected nutsPlatformService: NutsPlatformService, protected notificationService: NotificationService,
    protected priceOracleService: PriceOracleService, protected tokenService: TokenService, protected http: HttpClient) { }

  /**
   * Checks whether the current user is in position with the specific category.
   * @param category 
   */
  public isIssuanceInPosition(issuance: IssuanceModel, category: string): boolean {
    const currentAccount = this.nutsPlatformService.currentAccount.toLowerCase();
    // If the current user is neither maker or taker, return false
    if (issuance.makeraddress.toLowerCase() !== currentAccount && (issuance.engagements.length === 0 ||
      issuance.engagements[0].takeraddress.toLowerCase() !== currentAccount)) return false;

    // Check category
    switch (category) {
      case 'engageable':
        return issuance.issuancestate === IssuanceState.Engageable;
      case 'engaged':
        return issuance.engagements.length > 0 && issuance.engagements[0].engagementstate === EngagementState.Active;
      case 'inactive':
        return issuance.issuancestate === IssuanceState.Cancelled || (issuance.engagements.length > 0 &&
          issuance.engagements[0].engagementstate === EngagementState.Complete);
      default:
        return true;
    }
  }

  public getCollateralValue(principalToken: TokenModel, collateralToken: TokenModel, inputAmount: string, collateralRatio: number) {
    const BN = this.nutsPlatformService.web3.utils.BN;
    const collateralAmountInPrincipal = new BN(inputAmount).mul(new BN(collateralRatio)).div(new BN(10000));
    return this.priceOracleService.getConvertedActualValue(principalToken, collateralToken, collateralAmountInPrincipal);
  }

  public getInterestValue(inputAmount: string, interestRate: number, tenorDays: number) {
    const BN = this.nutsPlatformService.web3.utils.BN;
    return new BN(inputAmount).mul(new BN(interestRate * 10000 * tenorDays)).div(new BN(10000)).toString();
  }

  protected engageIssuance(instrumentName: string, issuanceId: number) {
    const instrumentManagerContract = this.nutsPlatformService.getInstrumentManagerContract(instrumentName);
    return instrumentManagerContract.methods.engageIssuance(issuanceId, this.nutsPlatformService.web3.utils.fromAscii("")).send({ from: this.nutsPlatformService.currentAccount, gas: 6721975 })
      .on('transactionHash', (transactionHash) => {
        // Records the transaction
        const depositTransaction = new TransactionModel(transactionHash, TransactionType.ACCEPT_OFFER, NotificationRole.TAKER,
          this.nutsPlatformService.currentAccount, issuanceId, {});
        this.notificationService.addTransaction(instrumentName, depositTransaction).subscribe(result => {
          // Note: Transaction Sent event is not sent until the transaction is recored in notification server!
          this.nutsPlatformService.transactionSentSubject.next(transactionHash);
        });
      });
  }

  protected cancelIssuance(instrumentName: string, issuanceId: number) {
    const instrumentManagerContract = this.nutsPlatformService.getInstrumentManagerContract(instrumentName);
    return instrumentManagerContract.methods.notifyCustomEvent(issuanceId, this.nutsPlatformService.web3.utils.fromAscii(CANCEL_ISSUANCE_EVENT),
      this.nutsPlatformService.web3.utils.fromAscii("")).send({ from: this.nutsPlatformService.currentAccount, gas: 6721975 })
      .on('transactionHash', (transactionHash) => {
        // Records the transaction
        const depositTransaction = new TransactionModel(transactionHash, TransactionType.CANCEL_OFFER, NotificationRole.MAKER,
          this.nutsPlatformService.currentAccount, issuanceId, {});
        this.notificationService.addTransaction(instrumentName, depositTransaction).subscribe(result => {
          // Note: Transaction Sent event is not sent until the transaction is recored in notification server!
          this.nutsPlatformService.transactionSentSubject.next(transactionHash);
        });
      });
  }

  protected repayIssuance(instrumentName: string, issuanceId: number, principalToken: TokenModel, tokenAmount: string) {
    const instrumentManagerContract = this.nutsPlatformService.getInstrumentManagerContract(instrumentName);

    return instrumentManagerContract.methods.notifyCustomEvent(issuanceId, this.nutsPlatformService.web3.utils.fromAscii(REPAY_ISSUANCE_EVENT),
      this.nutsPlatformService.web3.utils.fromAscii("")).send({ from: this.nutsPlatformService.currentAccount, gas: 6721975 })
      .on('transactionHash', (transactionHash) => {
        // Records the transaction
        const depositTransaction = new TransactionModel(transactionHash, TransactionType.PAY_OFFER, NotificationRole.TAKER,
          this.nutsPlatformService.currentAccount, issuanceId,
          {
            principalTokenName: principalToken.tokenSymbol, principalTokenAddress: principalToken.tokenAddress, totalAmount: tokenAmount,
          }
        );
        this.notificationService.addTransaction(instrumentName, depositTransaction).subscribe(result => {
          this.nutsPlatformService.transactionSentSubject.next(transactionHash);
        });
      });
  }

  protected getIssuances(instrumentId: number) {
    return this.http.get<IssuanceModel[]>(`${this.nutsPlatformService.getApiServerHost()}/instruments/${instrumentId}/issuances`);
  }
}

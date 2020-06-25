import { Injectable } from "@angular/core";
import { InstrumentService } from '../instrument.service';
import { IssuanceModel } from '../issuance.model';
import { Subject, Observable, of } from 'rxjs';
import { NutsPlatformService, BORROWING_NAME } from 'src/app/common/web3/nuts-platform.service';
import { NotificationService } from 'src/app/notification/notification.service';
import { TokenService } from 'src/app/common/token/token.service';
import { HttpClient } from '@angular/common/http';
import * as isEqual from 'lodash.isequal';
import { AccountService } from 'src/app/account/account.service';
import { TokenModel } from 'src/app/common/token/token.model';
import { TransactionType, NotificationRole, TransactionModel } from 'src/app/notification/transaction.model';
import { BorrowingIssuanceModel } from './borrowing-issuance.model';
import { PriceOracleService } from 'src/app/common/web3/price-oracle.service';
import { tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class BorrowingService extends InstrumentService {
    public borrowingIssuances: IssuanceModel[] = [];
    public borrowingIssuancesUpdated: Subject<IssuanceModel[]> = new Subject();
    private borrowingIssuanceMap = {};

    constructor(nutsPlatformService: NutsPlatformService, notificationService: NotificationService,
        tokenService: TokenService, http: HttpClient, private accountService: AccountService,
        priceOracleService: PriceOracleService) {
        super(nutsPlatformService, notificationService, priceOracleService, tokenService, http);

        this.reloadBorrowingIssuances();
        this.nutsPlatformService.platformInitializedSubject.subscribe(initialized => {
            if (!initialized) return;
            console.log('Platform initialized. Reloading borrowing issuances.');
            this.reloadBorrowingIssuances();
        });
        this.nutsPlatformService.currentNetworkSubject.subscribe(currentNetwork => {
            console.log('Network changed. Reloading borrowing issuances.', currentNetwork);
            this.reloadBorrowingIssuances();
        });

        // Reloads issuances every 30s.
        setInterval(this.reloadBorrowingIssuances.bind(this), 30000);
    }

    public async reloadBorrowingIssuances(times: number = 1, interval: number = 1000) {
        const instrumentId = this.nutsPlatformService.getInstrumentId(BORROWING_NAME);
        let count = 0;
        let intervalId = setInterval(() => {
            this.getIssuances(instrumentId).subscribe(borrowingIssuances => {
                if (isEqual(borrowingIssuances, this.borrowingIssuances))   return;
                this.updateBorrowingIssuance(borrowingIssuances);
                // We could stop prematurally once we get an update!
                clearInterval(intervalId);
            });
            if (++count >= times) clearInterval(intervalId);
        }, interval);
    }

    public getBorrowingIssuances(): Observable<IssuanceModel[]> {
        if (this.borrowingIssuances.length > 0) return of(this.borrowingIssuances);
        const instrumentId = this.nutsPlatformService.getInstrumentId(BORROWING_NAME);
        return this.getIssuances(instrumentId).pipe(tap(borrowingIssuances => this.updateBorrowingIssuance(borrowingIssuances)));
    }

    private updateBorrowingIssuance(borrowingIssuances: IssuanceModel[]) {
        console.log('Borrowing issuance list updated.');
        this.borrowingIssuances = borrowingIssuances;
                    this.borrowingIssuancesUpdated.next(this.borrowingIssuances);
                    this.borrowingIssuanceMap = {};
                    for (const issuance of borrowingIssuances) {
                        this.borrowingIssuanceMap[issuance.issuanceid] = issuance;
                    }
    }

    public getBorrowingIssuance(issuanceId): IssuanceModel {
        return this.borrowingIssuanceMap[issuanceId];
    }

    public createBorrowingIssuance(principalToken: TokenModel, principalAmount: string, collateralToken: TokenModel,
        collateralRatio: number, tenor: number, interestRate: number) {

        const issuanceDuration = 14 * 24 * 3600;   // Hard-coded 14 days duration
        const collateralRatioValue = '' + Math.floor(collateralRatio * 10000);   // Collateral ratio has 4 decimals
        const interestRateValue = '' + Math.floor(interestRate * 1000000);  // Interest rate has 6 decimals
        const makerData = this.nutsPlatformService.web3.eth.abi.encodeParameters(['uint256', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256'],
            [issuanceDuration, principalToken.tokenAddress, collateralToken.tokenAddress, principalAmount, tenor, collateralRatioValue, interestRateValue]);

        const instrumentManagerContract = this.nutsPlatformService.getInstrumentManagerContract(BORROWING_NAME);
        return instrumentManagerContract.methods.createIssuance(makerData).send({ from: this.nutsPlatformService.currentAccount, gas: 6721975 })
            .on('transactionHash', (transactionHash) => {
                // Records the transaction
                const depositTransaction = new TransactionModel(transactionHash, TransactionType.CREATE_OFFER, NotificationRole.MAKER,
                    this.nutsPlatformService.currentAccount, 0,
                    {
                        principalTokenName: principalToken.tokenSymbol, principalTokenAddress: principalToken.tokenAddress,
                        principalAmount: principalAmount, collateralTokenName: collateralToken.tokenSymbol,
                        collateralTokenAddress: collateralToken.tokenAddress, collateralRatio: `${collateralRatio}`,
                        tenor: `${tenor}`, interestRate: `${interestRate}`,
                    }
                );
                this.notificationService.addTransaction(BORROWING_NAME, depositTransaction).subscribe(result => {
                    console.log(result);
                    // Note: Transaction Sent event is not sent until the transaction is recored in notification server!
                    this.nutsPlatformService.transactionSentSubject.next(transactionHash);
                });
            });
    }

    public engageBorrowingIssuance(issuanceId) {
        return this.engageIssuance(BORROWING_NAME, issuanceId)
            .on('transactionHash', transactionHash => this.monitorBorrowingTransaction(transactionHash));
    }

    public cancelBorrowingIssuance(issuanceId) {
        return this.cancelIssuance(BORROWING_NAME, issuanceId)
            .on('transactionHash', transactionHash => this.monitorBorrowingTransaction(transactionHash));
    }

    public repayBorrowingIssuance(issuanceId: number, principalToken: TokenModel, tokenAmount: string) {
        const engagementId = this.borrowingIssuanceMap[issuanceId].engagements[0].engagementid;
        return this.repayIssuance(BORROWING_NAME, issuanceId, engagementId, principalToken, tokenAmount)
            .on('transactionHash', transactionHash => this.monitorBorrowingTransaction(transactionHash));
    }

    public getBorrowingCollateralValue(borrowingIssuance: BorrowingIssuanceModel) {
        const borrowingToken = this.tokenService.getTokenByAddress(borrowingIssuance.borrowingtokenaddress);
        const collateralToken = this.tokenService.getTokenByAddress(borrowingIssuance.collateraltokenaddress);

        return this.getCollateralValue(borrowingToken, collateralToken, borrowingIssuance.borrowingamount, Number(borrowingIssuance.collateralratio) / 10000);
    }

    public getPerDayInterest(borrowingIssuance: BorrowingIssuanceModel) {
        const BN = this.nutsPlatformService.web3.utils.BN;
        return new BN(borrowingIssuance.borrowingamount).mul(new BN(borrowingIssuance.interestrate)).div(new BN(1000000)).toString();
    }

    private monitorBorrowingTransaction(transactionHash) {
        // Monitoring transaction status(work around for Metamask mobile)
        const interval = setInterval(async () => {
            const receipt = await this.nutsPlatformService.web3.eth.getTransactionReceipt(transactionHash);
            if (!receipt || !receipt.blockNumber) return;

            console.log('Borrowing receipt', receipt);
            // New borrowing issuance created. Need to refresh the borrowing issuance list.
            this.reloadBorrowingIssuances(5, 3000);
            // New borrowing issuance created. Need to update the input token balance as well.
            this.accountService.refreshAccountBalance(BORROWING_NAME, 5, 3000);
            this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
            clearInterval(interval);
        }, 2000);
    }
}
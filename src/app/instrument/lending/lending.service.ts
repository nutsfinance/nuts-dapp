import { Injectable } from "@angular/core";
import { InstrumentService } from '../instrument.service';
import { IssuanceModel } from '../issuance.model';
import { Subject, Observable, of } from 'rxjs';
import { NutsPlatformService, LENDING_NAME } from 'src/app/common/web3/nuts-platform.service';
import { NotificationService } from 'src/app/notification/notification.service';
import { TokenService } from 'src/app/common/token/token.service';
import { HttpClient } from '@angular/common/http';
import * as isEqual from 'lodash.isequal';
import { AccountService } from 'src/app/account/account.service';
import { TokenModel } from 'src/app/common/token/token.model';
import { TransactionType, NotificationRole, TransactionModel } from 'src/app/notification/transaction.model';
import { LendingIssuanceModel } from './lending-issuance.model';
import { PriceOracleService } from 'src/app/common/web3/price-oracle.service';
import { tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class LendingService extends InstrumentService {
    public lendingIssuances: IssuanceModel[] = [];
    public lendingIssuancesUpdated: Subject<IssuanceModel[]> = new Subject();
    private lendingIssuanceMap = {};

    constructor(nutsPlatformService: NutsPlatformService, notificationService: NotificationService,
        tokenService: TokenService, http: HttpClient, private accountService: AccountService,
        priceOracleService: PriceOracleService) {
        super(nutsPlatformService, notificationService, priceOracleService, tokenService, http);

        this.reloadLendingIssuances();
        this.nutsPlatformService.platformInitializedSubject.subscribe(initialized => {
            if (!initialized) return;
            console.log('Platform initialized. Reloading lending issuances.');
            this.reloadLendingIssuances();
        });
        this.nutsPlatformService.currentNetworkSubject.subscribe(currentNetwork => {
            console.log('Network changed. Reloading lending issuances.', currentNetwork);
            this.reloadLendingIssuances();
        });

        // Reloads issuances every 30s.
        setInterval(this.reloadLendingIssuances.bind(this), 30000);
    }

    public async reloadLendingIssuances(times: number = 1, interval: number = 1000) {
        const instrumentId = this.nutsPlatformService.getInstrumentId(LENDING_NAME);
        let count = 0;
        let intervalId = setInterval(() => {
            this.getIssuances(instrumentId).subscribe(lendingIssuances => {
                if (isEqual(lendingIssuances, this.lendingIssuances))   return;
                // Update the lending issuance list if there is a change
                this.updateLendingIssuance(lendingIssuances);
                // We could stop prematurally once we get an update!
                clearInterval(intervalId);
            });
            if (++count >= times) clearInterval(intervalId);
        }, interval);
    }

    public getLendingIssuances(): Observable<IssuanceModel[]> {
        if (this.lendingIssuances.length > 0) return of(this.lendingIssuances);
        const instrumentId = this.nutsPlatformService.getInstrumentId(LENDING_NAME);
        return this.getIssuances(instrumentId).pipe(tap(lendingIssuances => this.updateLendingIssuance(lendingIssuances)));
    }

    private updateLendingIssuance(lendingIssuances: IssuanceModel[]) {
        console.log('Lending issuance list updated.');
        this.lendingIssuances = lendingIssuances;
        this.lendingIssuancesUpdated.next(this.lendingIssuances);
        this.lendingIssuanceMap = {};
        for (const issuance of lendingIssuances) {
            this.lendingIssuanceMap[issuance.issuanceid] = issuance;
        }
    }

    public getLendingIssuance(issuanceId): IssuanceModel {
        return this.lendingIssuanceMap[issuanceId];
    }

    public createLendingIssuance(principalToken: TokenModel, principalAmount: string, collateralToken: TokenModel,
        collateralRatio: number, tenor: number, interestRate: number) {

        const issuanceDuration = 14 * 24 * 3600;   // Hard-coded 14 days duration
        const collateralRatioValue = '' + Math.floor(collateralRatio * 10000);   // Collateral ratio has 4 decimals
        const interestRateValue = '' + Math.floor(interestRate * 1000000);  // Interest rate has 6 decimals
        const makerData = this.nutsPlatformService.web3.eth.abi.encodeParameters(['uint256', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256'],
            [issuanceDuration, principalToken.tokenAddress, collateralToken.tokenAddress, principalAmount, tenor, collateralRatioValue, interestRateValue]);

        const instrumentManagerContract = this.nutsPlatformService.getInstrumentManagerContract(LENDING_NAME);
        return instrumentManagerContract.methods.createIssuance(makerData).send({ from: this.nutsPlatformService.currentAccount, gas: 6721975 })
            .on('transactionHash', (transactionHash) => {
                // Records the transaction
                const depositTransaction = new TransactionModel(transactionHash, TransactionType.CREATE_OFFER, NotificationRole.MAKER,
                    this.nutsPlatformService.currentAccount, 0,
                    {
                        principalTokenName: principalToken.tokenSymbol, principalTokenAddress: principalToken.tokenAddress,
                        principalAmount: principalAmount, collateralTokenName: collateralToken.tokenSymbol,
                        collateralTokenAddress: collateralToken.tokenAddress, collateralRatio: collateralRatioValue,
                        tenor: `${tenor}`, interestRate: interestRateValue,
                    }
                );
                this.notificationService.addTransaction(LENDING_NAME, depositTransaction).subscribe(result => {
                    console.log(result);
                    // Note: Transaction Sent event is not sent until the transaction is recored in notification server!
                    this.nutsPlatformService.transactionSentSubject.next(transactionHash);
                });
            });
    }

    public engageLendingIssuance(issuanceId) {
        return this.engageIssuance(LENDING_NAME, issuanceId)
            .on('transactionHash', transactionHash => this.monitorLendingTransaction(transactionHash));
    }

    public cancelLendingIssuance(issuanceId) {
        return this.cancelIssuance(LENDING_NAME, issuanceId)
            .on('transactionHash', transactionHash => this.monitorLendingTransaction(transactionHash));
    }

    public repayLendingIssuance(issuanceId: number, principalToken: TokenModel, tokenAmount: string) {
        return this.repayIssuance(LENDING_NAME, issuanceId, principalToken, tokenAmount)
            .on('transactionHash', transactionHash => this.monitorLendingTransaction(transactionHash));
    }

    public getLendingCollateralValue(lendingIssuance: LendingIssuanceModel) {
        const lendingToken = this.tokenService.getTokenByAddress(lendingIssuance.lendingtokenaddress);
        const collateralToken = this.tokenService.getTokenByAddress(lendingIssuance.collateraltokenaddress);

        return this.getCollateralValue(lendingToken, collateralToken, lendingIssuance.lendingamount, Number(lendingIssuance.collateralratio) / 10000);
    }

    public getPerDayInterest(lendingIssuance: LendingIssuanceModel) {
        const BN = this.nutsPlatformService.web3.utils.BN;
        return new BN(lendingIssuance.lendingamount).mul(new BN(lendingIssuance.interestrate)).div(new BN(1000000)).toString();
    }

    private monitorLendingTransaction(transactionHash) {
        // Monitoring transaction status(work around for Metamask mobile)
        const interval = setInterval(async () => {
            const receipt = await this.nutsPlatformService.web3.eth.getTransactionReceipt(transactionHash);
            if (!receipt || !receipt.blockNumber) return;

            console.log('Lending receipt', receipt);
            // New lending issuance created. Need to refresh the lending issuance list.
            this.reloadLendingIssuances(5, 3000);
            // New lending issuance created. Need to update the input token balance as well.
            this.accountService.refreshAccountBalance(LENDING_NAME, 5, 3000);
            this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
            clearInterval(interval);
        }, 2000);
    }
}
import { Injectable } from "@angular/core";
import { InstrumentService } from '../instrument.service';
import { IssuanceModel } from '../issuance.model';
import { Subject, Observable, of } from 'rxjs';
import { NutsPlatformService, SWAP_NAME } from 'src/app/common/web3/nuts-platform.service';
import { NotificationService } from 'src/app/notification/notification.service';
import { TokenService } from 'src/app/common/token/token.service';
import { HttpClient } from '@angular/common/http';
import * as isEqual from 'lodash.isequal';
import { AccountService } from 'src/app/account/account.service';
import { TokenModel } from 'src/app/common/token/token.model';
import { TransactionType, NotificationRole, TransactionModel } from 'src/app/notification/transaction.model';
import { PriceOracleService } from 'src/app/common/web3/price-oracle.service';
import { tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class SwapService extends InstrumentService {
    public swapIssuances: IssuanceModel[] = [];
    public swapIssuancesUpdated: Subject<IssuanceModel[]> = new Subject();
    private swapIssuanceMap = {};

    constructor(nutsPlatformService: NutsPlatformService, notificationService: NotificationService,
        priceOracleService: PriceOracleService, tokenService: TokenService, http: HttpClient, private accountService: AccountService) {
        super(nutsPlatformService, notificationService, priceOracleService, tokenService, http);

        this.reloadSwapIssuances();
        this.nutsPlatformService.platformInitializedSubject.subscribe(initialized => {
            if (!initialized) return;
            console.log('Platform initialized. Reloading swap issuances.');
            this.reloadSwapIssuances();
        });
        this.nutsPlatformService.currentNetworkSubject.subscribe(currentNetwork => {
            console.log('Network changed. Reloading swap issuances.', currentNetwork);
            this.reloadSwapIssuances();
        });

        // Reloads issuances every 30s.
        setInterval(this.reloadSwapIssuances.bind(this), 30000);
    }

    public async reloadSwapIssuances(times: number = 1, interval: number = 1000) {
        const instrumentId = this.nutsPlatformService.getInstrumentId(SWAP_NAME);
        let count = 0;
        let intervalId = setInterval(() => {
            this.getIssuances(instrumentId).subscribe(swapIssuances => {
                if (isEqual(swapIssuances, this.swapIssuances))    return;
                // Update the swap issuance list if there is a change
                
                this.updateSwapIssuance(swapIssuances);
                // We could stop prematurally once we get an update!
                clearInterval(intervalId);
            });
            if (++count >= times) clearInterval(intervalId);
        }, interval);
    }

    public getSwapIssuances(): Observable<IssuanceModel[]> {
        if (this.swapIssuances.length > 0) return of(this.swapIssuances);
        const instrumentId = this.nutsPlatformService.getInstrumentId(SWAP_NAME);
        return this.getIssuances(instrumentId).pipe(tap(swapIssuances => this.updateSwapIssuance(swapIssuances)));
    }

    private updateSwapIssuance(swapIssuances: IssuanceModel[]) {
        console.log('Swap issuance list updated.');
        this.swapIssuances = swapIssuances;
        this.swapIssuancesUpdated.next(this.swapIssuances);
        this.swapIssuanceMap = {};
        for (const issuance of swapIssuances) {
            this.swapIssuanceMap[issuance.issuanceid] = issuance;
        }
    }

    public getSwapIssuance(issuanceId): IssuanceModel {
        return this.swapIssuanceMap[issuanceId];
    }

    public createSwapIssuance(inputToken: TokenModel, outputToken: TokenModel, inputAmount: string, outputAmount: string, duration: number) {
        const issuanceDuration = duration * 24 * 3600;  // Duration is in days
        const makerData = this.nutsPlatformService.web3.eth.abi.encodeParameters(['uint256', 'address', 'address', 'uint256', 'uint256'],
            [issuanceDuration, inputToken.tokenAddress, outputToken.tokenAddress, inputAmount, outputAmount]);

        const instrumentManagerContract = this.nutsPlatformService.getInstrumentManagerContract(SWAP_NAME);
        return instrumentManagerContract.methods.createIssuance(makerData).send({ from: this.nutsPlatformService.currentAccount, gas: 6721975 })
            .on('transactionHash', (transactionHash) => {
                // Records the transaction
                const depositTransaction = new TransactionModel(transactionHash, TransactionType.CREATE_OFFER, NotificationRole.MAKER,
                    this.nutsPlatformService.currentAccount, 0,
                    {
                        inputTokenName: inputToken.tokenSymbol, inputTokenAddress: inputToken.tokenAddress,
                        outputTokenName: outputToken.tokenSymbol, outputTokenAddress: outputToken.tokenAddress,
                        inputAmount: inputAmount, outputAmount: outputAmount, duration: `${duration}`,
                    }
                );
                this.notificationService.addTransaction(SWAP_NAME, depositTransaction).subscribe(result => {
                    // Note: Transaction Sent event is not sent until the transaction is recored in notification server!
                    this.nutsPlatformService.transactionSentSubject.next(transactionHash);
                });
            });
    }

    public engageSwapIssuance(issuanceId) {
        return this.engageIssuance(SWAP_NAME, issuanceId)
            .on('transactionHash', transactionHash => this.monitorSwapTransaction(transactionHash));
    }

    public cancelSwapIssuance(issuanceId) {
        return this.cancelIssuance(SWAP_NAME, issuanceId)
            .on('transactionHash', transactionHash => this.monitorSwapTransaction(transactionHash));
    }

    private monitorSwapTransaction(transactionHash) {
        // Monitoring transaction status(work around for Metamask mobile)
        const interval = setInterval(async () => {
            const receipt = await this.nutsPlatformService.web3.eth.getTransactionReceipt(transactionHash);
            if (!receipt || !receipt.blockNumber) return;

            console.log('Swap receipt', receipt);
            // New swap issuance created. Need to refresh the swap issuance list.
            this.reloadSwapIssuances(5, 3000);
            // New swap issuance created. Need to update the input token balance as well.
            this.accountService.refreshAccountBalance(SWAP_NAME, 5, 3000);
            this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
            clearInterval(interval);
        }, 2000);
    }
}
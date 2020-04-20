import { Location } from '@angular/common';
import { Component, NgZone, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { SwapIssuanceModel } from 'src/app/common/model/swap-issuance.model';
import { NutsPlatformService, USD_ADDRESS, CNY_ADDRESS } from 'src/app/common/web3/nuts-platform.service';
import { PriceOracleService } from 'src/app/common/web3/price-oracle.service';
import { CurrencyService } from 'src/app/common/currency-select/currency.service';
import { InstrumentService } from 'src/app/common/web3/instrument.service';
import { MatDialog } from '@angular/material';
import { TransactionInitiatedDialog } from 'src/app/common/transaction-initiated-dialog/transaction-initiated-dialog.component';
import { AccountBalanceService } from 'src/app/common/web3/account-balance.service';

@Component({
  selector: 'app-swap-detail',
  templateUrl: './swap-detail.component.html',
  styleUrls: ['./swap-detail.component.scss']
})
export class SwapDetailComponent implements OnInit {
  public issuanceId: number;
  public issuance: SwapIssuanceModel;
  public inputToken: string;
  public outputToken: string;
  public outputTokenBalance = -1;
  public outputSufficient = true;

  public convertedInputValue: Promise<number>;
  public convertedOutputValue: Promise<number>;

  private accountUpdatedSubscription: Subscription;
  private issuanceIdSubscription: Subscription;
  private swapUpdatedSubscription: Subscription;
  private currencyUpdatedSubscription: Subscription;

  constructor(public nutsPlatformService: NutsPlatformService, private instrumentService: InstrumentService,
    private priceOracleService: PriceOracleService, public currencyService: CurrencyService, private accountBalanceService: AccountBalanceService,
    private route: ActivatedRoute, private zone: NgZone, private location: Location, private dialog: MatDialog) { }

  ngOnInit() {
    this.issuanceId = this.route.snapshot.params['id'];
    this.updateSwapIssuance();
    this.issuanceIdSubscription = this.route.params.subscribe((params) => {
      this.issuanceId = +params['id'];
      this.updateSwapIssuance();
    });
    this.accountUpdatedSubscription = this.nutsPlatformService.currentAccountSubject.subscribe(_ => {
      this.updateSwapIssuance();
    });
    this.swapUpdatedSubscription = this.instrumentService.swapIssuancesUpdatedSubject.subscribe(_ => {
      this.updateSwapIssuance();
    });
    this.currencyUpdatedSubscription = this.currencyService.currencyUpdatedSubject.subscribe(_ => {
      this.updateConvertedValue();
    });
  }

  ngOnDestroy() {
    this.accountUpdatedSubscription.unsubscribe();
    this.issuanceIdSubscription.unsubscribe();
    this.swapUpdatedSubscription.unsubscribe();
    this.currencyUpdatedSubscription.unsubscribe();
  }

  navigateBack() {
    this.location.back();
  }

  onOutputTokenBalanceUpdated(balance) {
    this.outputTokenBalance = balance;
    setTimeout(() => {
      this.outputSufficient = this.outputTokenBalance >= this.issuance.outputAmount;
    });
  }

  engageIssuance() {
    if (this.outputTokenBalance < this.issuance.outputAmount) return;
    this.instrumentService.engageIssuance('swap', this.issuanceId)
      .on('transactionHash', transactionHash => {
        this.zone.run(() => {
          // Opens Engagement Initiated dialog.
          const transactionInitiatedDialog = this.dialog.open(TransactionInitiatedDialog, {
            width: '90%',
            data: {
              type: 'engage_issuance',
              instrument: 'swap',
              issuanceId: this.issuance.issuanceId,
              tokenName: this.inputToken,
              tokenAmount: this.nutsPlatformService.getTokenValueByName(this.inputToken, this.issuance.inputAmount),
            },
          });
          transactionInitiatedDialog.afterClosed().subscribe(() => {
            this.location.back();
          });
        });

        this.monitorSwapTransaction(transactionHash);
      });
  }

  cancelIssuance() {
    this.instrumentService.cancelIssuance('swap', this.issuanceId)
      .on('transactionHash', transactionHash => {
        this.zone.run(() => {
          // Opens Cancel Initiated dialog.
          const transactionInitiatedDialog = this.dialog.open(TransactionInitiatedDialog, {
            width: '90%',
            data: {
              type: 'cancel_issuance',
              instrument: 'swap',
              issuanceId: this.issuance.issuanceId,
            },
          });
          transactionInitiatedDialog.afterClosed().subscribe(() => {
            this.location.back();
          });
        });

        this.monitorSwapTransaction(transactionHash);
      });
  }

  private monitorSwapTransaction(transactionHash) {
    // Monitoring transaction status(work around for Metamask mobile)
    const interval = setInterval(async () => {
      const receipt = await this.nutsPlatformService.web3.eth.getTransactionReceipt(transactionHash);
      if (!receipt || !receipt.blockNumber) return;

      console.log('Create receipt', receipt);
      // Swap transaction successful. Need to refresh the swap issuance list.
      this.instrumentService.reloadSwapIssuances();
      // Swap transaction successful. Need to update the input token balance as well.
      this.accountBalanceService.updateAssetBalance('swap', this.inputToken);
      this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
      clearInterval(interval);
    }, 2000);
  }

  private updateSwapIssuance() {
    this.zone.run(() => {
      this.issuance = this.instrumentService.getSwapIssuanceById(this.issuanceId);
      if (this.issuance) {
        console.log('Issuance detail', this.issuance);
        // Compute issuance token values
        this.inputToken = this.nutsPlatformService.getTokenNameByAddress(this.issuance.inputTokenAddress);
        this.outputToken = this.nutsPlatformService.getTokenNameByAddress(this.issuance.outputTokenAddress);
        
        this.updateConvertedValue();
      }
    });
  }

  private updateConvertedValue() {
        // Compute converted issuance token values
        const targetTokenAddress = this.currencyService.currency === 'USD' ? USD_ADDRESS : CNY_ADDRESS;
        this.convertedInputValue = this.priceOracleService.getConvertedValue(targetTokenAddress,
          this.issuance.inputTokenAddress, this.issuance.inputAmount);
        this.convertedOutputValue = this.priceOracleService.getConvertedValue(targetTokenAddress,
          this.issuance.outputTokenAddress, this.issuance.outputAmount);
  }
}

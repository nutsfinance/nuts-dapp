import { Location } from '@angular/common';
import { Component, NgZone, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { NutsPlatformService, USD_ADDRESS, CNY_ADDRESS, SWAP_NAME } from 'src/app/common/web3/nuts-platform.service';
import { PriceOracleService } from 'src/app/common/web3/price-oracle.service';
import { CurrencyService } from 'src/app/common/currency-select/currency.service';
import { MatDialog } from '@angular/material';
import { TransactionInitiatedDialog } from 'src/app/common/transaction-initiated-dialog/transaction-initiated-dialog.component';
import { IssuanceModel } from '../../issuance.model';
import { TokenModel } from 'src/app/common/token/token.model';
import { SwapService } from '../swap.service';
import { AccountService } from 'src/app/account/account.service';
import { SwapIssuanceModel } from '../swap-issuance.model';
import { TokenService } from 'src/app/common/token/token.service';

@Component({
  selector: 'app-swap-detail',
  templateUrl: './swap-detail.component.html',
  styleUrls: ['./swap-detail.component.scss']
})
export class SwapDetailComponent implements OnInit {
  public issuance: IssuanceModel;
  public swapIssuance: SwapIssuanceModel;
  public inputToken: TokenModel;
  public outputToken: TokenModel;
  public outputTokenBalance = '';
  public outputSufficient = true;

  public convertedInputValue: Promise<number>;
  public convertedOutputValue: Promise<number>;

  private accountUpdatedSubscription: Subscription;
  private issuanceIdSubscription: Subscription;
  private swapUpdatedSubscription: Subscription;
  private currencyUpdatedSubscription: Subscription;

  constructor(public nutsPlatformService: NutsPlatformService, private swapService: SwapService, private tokenService: TokenService,
    private priceOracleService: PriceOracleService, public currencyService: CurrencyService, private accountService: AccountService,
    private route: ActivatedRoute, private zone: NgZone, private location: Location, private dialog: MatDialog) { }

  ngOnInit() {
    this.updateSwapIssuance(this.route.snapshot.params['id']);
    this.issuanceIdSubscription = this.route.params.subscribe((params) => {
      this.updateSwapIssuance(params['id']);
    });
    this.accountUpdatedSubscription = this.nutsPlatformService.currentAccountSubject.subscribe(account => {
      this.updateSwapIssuance(this.issuance.issuanceid);
    });
    this.swapUpdatedSubscription = this.swapService.swapIssuancesUpdated.subscribe(_ => {
      this.updateSwapIssuance(this.issuance.issuanceid);
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
      const BN = this.nutsPlatformService.web3.utils.BN;
      this.outputSufficient = new BN(balance).gte(new BN(this.swapIssuance.outputamount));
    });
  }

  engageIssuance() {
    if (!this.outputSufficient) return;
    this.swapService.engageSwapIssuance(this.issuance.issuanceid)
      .on('transactionHash', transactionHash => {
        this.zone.run(() => {
          // Opens Engagement Initiated dialog.
          const transactionInitiatedDialog = this.dialog.open(TransactionInitiatedDialog, {
            width: '90%',
            data: {
              type: 'engage_issuance', instrument: SWAP_NAME, issuanceId: this.issuance.issuanceid,
              tokenName: this.inputToken, tokenAmount: this.swapIssuance.inputamount,
            },
          });
          transactionInitiatedDialog.afterClosed().subscribe(() => {
            this.location.back();
          });
        });
      });
  }

  cancelIssuance() {
    this.swapService.cancelSwapIssuance(this.issuance.issuanceid)
      .on('transactionHash', transactionHash => {
        this.zone.run(() => {
          // Opens Cancel Initiated dialog.
          const transactionInitiatedDialog = this.dialog.open(TransactionInitiatedDialog, {
            width: '90%',
            data: {
              type: 'cancel_issuance', instrument: SWAP_NAME, issuanceId: this.issuance.issuanceid,
            },
          });
          transactionInitiatedDialog.afterClosed().subscribe(() => {
            this.location.back();
          });
        });
      });
  }

  private updateSwapIssuance(issuanceId: number) {
    this.zone.run(() => {
      this.issuance = this.swapService.getSwapIssuance(issuanceId);
      if (this.issuance) {
        this.swapIssuance = this.issuance.issuancecustomproperty as SwapIssuanceModel;
        // Compute issuance token values
        this.inputToken = this.tokenService.getTokenByAddress(this.swapIssuance.inputtokenaddress);
        this.outputToken = this.tokenService.getTokenByAddress(this.swapIssuance.outputtokenaddress);
        
        this.updateConvertedValue();
      }
    });
  }

  private updateConvertedValue() {
    // Compute converted issuance token values
    this.convertedInputValue = this.priceOracleService.getConvertedCurrencyValue(this.inputToken,
      this.swapIssuance.inputamount);
    this.convertedOutputValue = this.priceOracleService.getConvertedCurrencyValue(this.outputToken,
      this.swapIssuance.outputamount);
  }
}

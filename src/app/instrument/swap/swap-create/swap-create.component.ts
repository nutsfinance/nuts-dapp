import { Component, OnInit, ViewChild, NgZone } from '@angular/core';
import { FormControl, FormGroup, NgForm } from '@angular/forms';
import { MatButtonToggleChange, MatDialog } from '@angular/material';
import { NutsPlatformService } from '../../../common/web3/nuts-platform.service';
import { PriceOracleService } from '../../../common/web3/price-oracle.service';
import { InstrumentService } from 'src/app/common/web3/instrument.service';
import { TransactionInitiatedDialog } from 'src/app/common/transaction-initiated-dialog/transaction-initiated-dialog.component';
import { AccountBalanceService } from 'src/app/common/web3/account-balance.service';

@Component({
  selector: 'app-swap-create',
  templateUrl: './swap-create.component.html',
  styleUrls: ['./swap-create.component.scss']
})
export class SwapCreateComponent implements OnInit {
  private tokens = ["ETH", "USDC", "USDT", "DAI", "NUTS"];
  @ViewChild('form', { static: true }) private form: NgForm;

  public createFormGroup: FormGroup;
  public inputToken = this.tokens[0];
  public outputToken = this.tokens[1];
  public inputAmount: number;
  public inputTokenBalance: number;
  public outputAmount: number;
  public duration: number;
  public showAlternativeTenor = false;

  constructor(private nutsPlatformService: NutsPlatformService, private instrumentService: InstrumentService,
    private priceOracleSercvice: PriceOracleService, private accountBalanceService: AccountBalanceService,
    private zone: NgZone, private dialog: MatDialog) { }

  ngOnInit() {
    this.createFormGroup = new FormGroup({
      'inputAmount': new FormControl('', this.validInputAmount.bind(this)),
      'outputAmount': new FormControl('', this.validOutputAmount.bind(this)),
      'duration': new FormControl('', this.validDurtion),
    });
  }

  onInputTokenSelected(token: string) {
    this.inputToken = token;
    this.createFormGroup.controls['inputAmount'].reset();
    // Update collaterals
    this.outputToken = token === this.tokens[0] ? this.tokens[1] : this.tokens[0];
  }

  onOutputTokenSelected(token: string) {
    this.outputToken = token;
  }

  onTenorChange(tenorChange: MatButtonToggleChange) {
    console.log(tenorChange.value);
    this.createFormGroup.patchValue({ 'duration': tenorChange.value });
  }

  /**
   * Should show error message when the control is invalid and either
   * 1) The control is touched
   * 2) Or the form is submitted
   * @param controlName
   */
  shouldShowErrorMessage(controlName: string): boolean {
    const formSubmitted = this.form.submitted;
    const controlTouched = this.createFormGroup.controls[controlName].touched;
    const controlInvalid = this.createFormGroup.controls[controlName].invalid;

    return controlInvalid && (controlTouched || formSubmitted);
  }
  
  async createSwapIssuance() {
    console.log(this.createFormGroup);
    if (!this.createFormGroup.valid) {
      return;
    }

    const inputAmount = this.inputToken === 'ETH' ?
      this.nutsPlatformService.getWeiFromEther(this.createFormGroup.value['inputAmount']) :
      this.createFormGroup.value['inputAmount'];
    const outputAmount = this.outputToken === 'ETH' ?
      this.nutsPlatformService.getWeiFromEther(this.createFormGroup.value['outputAmount']) :
      this.createFormGroup.value['outputAmount'];
    this.instrumentService.createSwapIssuance(this.inputToken, this.outputToken, inputAmount, outputAmount, 
      this.createFormGroup.value['duration'])
      .on('transactionHash', transactionHash => {
        // Show Transaction Initiated dialog
        this.zone.run(() => {
          // Opens Engagement Initiated dialog.
          const transactionInitiatedDialog = this.dialog.open(TransactionInitiatedDialog, {
            width: '90%',
            data: {
              type: 'create_issuance',
              instrument: 'swap',
              tokenName: this.inputToken,
              tokenAmount: this.createFormGroup.value['inputAmount'],
            },
          });
          transactionInitiatedDialog.afterClosed().subscribe(() => {
            this.resetForm();
            // Scroll to top
            document.body.scrollTop = document.documentElement.scrollTop = 0;
          });
        });

        // Monitoring transaction status(work around for Metamask mobile)
        const interval = setInterval(async () => {
          const receipt = await this.nutsPlatformService.web3.eth.getTransactionReceipt(transactionHash);
          if (!receipt || !receipt.blockNumber) return;

          console.log('Create receipt', receipt);
          // New swap issuance created. Need to refresh the swap issuance list.
          this.instrumentService.reloadSwapIssuances();
          // New swap issuance created. Need to update the input token balance as well.
          this.accountBalanceService.updateAssetBalance('swap', this.inputToken);
          this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
          clearInterval(interval);
        }, 2000);
      });
  }

  resetForm() {
    this.inputToken = this.tokens[0];
    this.outputToken = this.tokens[1];
    this.form.resetForm();
  }

  validInputAmount(control: FormControl): { [s: string]: boolean } {
    if (!control.value) {
      return { 'required': true };
    }
    if (this.inputTokenBalance < Number(control.value)) {
      return { 'insufficientBalance': true };
    }
    if ((this.inputToken === 'ETH' && Number.isNaN(Number(control.value))) || Number(control.value) <= 0) {
      return { 'nonPositiveAmount': true };
    }
    if (this.inputToken !== 'ETH' && !/^[1-9][0-9]*$/.test(control.value)) {
      return { 'nonIntegerAmount': true };
    }
    return null;
  }

  validOutputAmount(control: FormControl): { [s: string]: boolean } {
    if (!control.value) {
      return { 'required': true };
    }
    if ((this.outputToken === 'ETH' && Number.isNaN(Number(control.value))) || Number(control.value) <= 0) {
      return { 'nonPositiveAmount': true };
    }
    if (this.outputToken !== 'ETH' && !/^[1-9][0-9]*$/.test(control.value)) {
      return { 'nonIntegerAmount': true };
    }
    return null;
  }

  validDurtion(control: FormControl): { [s: string]: boolean } {
    if (!control.value) {
      return { 'required': true };
    }
    if (!/^[1-9][0-9]*$/.test(control.value)) {
      return { 'nonIntegerAmount': true };
    }
    if (Number(control.value) < 2 || Number(control.value) > 90) {
      return { 'invalidValue': true };
    }
    return null;
  }
}

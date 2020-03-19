import { Component, OnInit, ViewChild, NgZone } from '@angular/core';
import { FormControl, FormGroup, NgForm } from '@angular/forms';
import { MatButtonToggleChange, MatDialog } from '@angular/material';
import { NutsPlatformService } from '../../../common/web3/nuts-platform.service';
import { PriceOracleService } from '../../../common/web3/price-oracle.service';
import { InstrumentService } from 'src/app/common/web3/instrument.service';
import { TransactionInitiatedDialog } from 'src/app/common/transaction-initiated-dialog/transaction-initiated-dialog.component';


@Component({
  selector: 'app-lending-create',
  templateUrl: './lending-create.component.html',
  styleUrls: ['./lending-create.component.scss']
})
export class LendingCreateComponent implements OnInit {
  private tokens = ["ETH", "USDC", "USDT", "DAI", "NUTS"];
  @ViewChild('form', { static: true }) private form: NgForm;

  public createFormGroup: FormGroup;
  public showAlternativeTenor = false;
  public showAlternativeColleral = false;
  public showAlternativeInterest = false;
  public principalToken = this.tokens[0];
  public principalTokenBalance: number;
  public collateralToken = this.tokens[1];
  public collateralValue: Promise<number> = Promise.resolve(0);
  public interestValue = 0;

  constructor(private nutsPlatformService: NutsPlatformService, private instrumentService: InstrumentService,
    private priceOracleSercvice: PriceOracleService, private zone: NgZone, private dialog: MatDialog) { }

  ngOnInit() {
    this.createFormGroup = new FormGroup({
      'principalAmount': new FormControl('', this.validPrincipalAmount.bind(this)),
      'tenor': new FormControl('', this.validTenor),
      'collateralRatio': new FormControl('', this.validCollateralRatio),
      'interestRate': new FormControl('', this.validInterestRate),
    });
  }

  onPrincipalAmountUpdated() {
    this.collateralValue = this.getCollateralValue();
    this.interestValue = this.getInterestValue();
  }

  onPrincipalTokenSelected(token: string) {
    // Update principals
    this.principalToken = token;
    this.createFormGroup.controls['principalAmount'].reset();
    // Update collaterals
    this.collateralToken = token === this.tokens[0] ? this.tokens[1] : this.tokens[0];
    this.collateralValue = this.getCollateralValue();
  }

  onTenorChange(tenorChange: MatButtonToggleChange) {
    this.createFormGroup.patchValue({ 'tenor': tenorChange.value });
    this.interestValue = this.getInterestValue();
  }

  onCollateralTokenSelected(token: string) {
    this.collateralToken = token;
    this.createFormGroup.controls['collateralRatio'].reset();
    this.collateralValue = this.getCollateralValue();
  }

  onCollateralRatioChange(collateralRatioChange: MatButtonToggleChange) {
    this.createFormGroup.patchValue({ 'collateralRatio': collateralRatioChange.value });
    this.collateralValue = this.getCollateralValue();
  }

  onInterestRateChange(interestRateChange: MatButtonToggleChange) {
    this.createFormGroup.patchValue({ 'interestRate': interestRateChange.value });
    this.interestValue = this.getInterestValue();
    console.log(this.interestValue);
  }

  async getCollateralValue() {
    const principalTokenAddress = this.nutsPlatformService.getTokenAddressByName(this.principalToken);
    const collateralTokenAddress = this.nutsPlatformService.getTokenAddressByName(this.collateralToken);
    const result = await this.priceOracleSercvice.getPrice(collateralTokenAddress, principalTokenAddress);
    console.log('Collateral rate', result);
    return this.createFormGroup.value['principalAmount'] * this.createFormGroup.value['collateralRatio'] * result[1] / (result[0] * 100);
  }

  async createLendingIssuance() {
    console.log(this.createFormGroup);
    if (!this.createFormGroup.valid) {
      return;
    }
    this.instrumentService.createLendingIssuance(this.principalToken, this.createFormGroup.value['principalAmount'],
      this.collateralToken, this.createFormGroup.value['collateralRatio'], this.createFormGroup.value['tenor'],
      this.createFormGroup.value['interestRate'])
      .on('transactionHash', transactionHash => {
        // Show Transaction Initiated dialog
        this.zone.run(() => {
          // Opens Engagement Initiated dialog.
          const transactionInitiatedDialog = this.dialog.open(TransactionInitiatedDialog, {
            width: '90%',
            data: {
              type: 'create_issuance',
              principalAmount: this.createFormGroup.value['principalAmount'],
              principalTokenName: this.principalToken,
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
          this.instrumentService.reloadLendingIssuances();
          this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
          clearInterval(interval);
        }, 2000);
      });
  }

  resetForm() {
    this.principalToken = this.tokens[0];
    this.collateralToken = this.tokens[1];
    this.form.resetForm();
  }

  getInterestValue(): number {
    const principalAmount = Math.floor(this.createFormGroup.value['principalAmount'] * 10000);
    const interestRate = Math.floor(this.createFormGroup.value['interestRate'] * 10000);
    const tenor = this.createFormGroup.value['tenor'];
    const interest = principalAmount * interestRate * tenor / 10000000000;
    console.log(principalAmount, interestRate, tenor, interest);

    return interest;
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

  validPrincipalAmount(control: FormControl): { [s: string]: boolean } {
    if (!control.value) {
      return { 'required': true };
    }
    if (this.principalTokenBalance < Number(control.value)) {
      return { 'insufficientBalance': true };
    }
    if ((this.principalToken === 'ETH' && Number.isNaN(Number(control.value))) || Number(control.value) <= 0) {
      return { 'nonPositiveAmount': true };
    }
    if (this.principalToken !== 'ETH' && !/^[1-9][0-9]*$/.test(control.value)) {
      return { 'nonIntegerAmount': true };
    }
    return null;
  }

  validTenor(control: FormControl): { [s: string]: boolean } {
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

  validCollateralRatio(control: FormControl): { [s: string]: boolean } {
    if (!control.value) {
      return { 'required': true };
    }
    if (Number(control.value) < 50 || Number(control.value) > 200) {
      return { 'invalidValue': true };
    }
    return null;
  }

  validInterestRate(control: FormControl): { [s: string]: boolean } {
    if (!control.value) {
      return { 'required': true };
    }
    if (Number(control.value) < 0.01 || Number(control.value) > 5) {
      return { 'invalidValue': true };
    }
    return null;
  }
}

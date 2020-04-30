import { Component, OnInit, ViewChild, NgZone } from '@angular/core';
import { FormControl, FormGroup, NgForm } from '@angular/forms';
import { MatButtonToggleChange, MatDialog } from '@angular/material';
import { NutsPlatformService } from '../../../common/web3/nuts-platform.service';
import { PriceOracleService } from '../../../common/web3/price-oracle.service';
import { InstrumentService } from 'src/app/common/web3/instrument.service';
import { TransactionInitiatedDialog } from 'src/app/common/transaction-initiated-dialog/transaction-initiated-dialog.component';
import { AccountBalanceService } from 'src/app/common/web3/account-balance.service';

@Component({
  selector: 'app-borrowing-create',
  templateUrl: './borrowing-create.component.html',
  styleUrls: ['./borrowing-create.component.scss']
})
export class BorrowingCreateComponent implements OnInit {
  private tokens = ["ETH", "USDC", "USDT", "DAI", "NUTS"];
  @ViewChild('form', { static: true }) private form: NgForm;

  public createFormGroup: FormGroup;
  public showAlternativeTenor = false;
  public showAlternativeColleral = false;
  public showAlternativeInterest = false;
  public principalToken = this.tokens[0];
  public principalValue = 0;
  public collateralTokenBalance: number;
  public collateralToken = this.tokens[1];
  public collateralValue = 0;
  public interestValue = 0;

  constructor(private nutsPlatformService: NutsPlatformService, private instrumentService: InstrumentService,
    private priceOracleSercvice: PriceOracleService, private accountBalanceService: AccountBalanceService,
    private zone: NgZone, private dialog: MatDialog) { }

  ngOnInit() {
    this.createFormGroup = new FormGroup({
      'principalAmount': new FormControl('', this.validPrincipalAmount.bind(this)),
      'tenor': new FormControl('', this.validTenor),
      'collateralRatio': new FormControl('', this.validCollateralRatio),
      'interestRate': new FormControl('', this.validInterestRate),
    });
    this.createFormGroup.valueChanges.subscribe(_ => {
      this.principalValue = this.nutsPlatformService.getTokenActualValueByName(this.principalToken, this.createFormGroup.value['principalAmount']);
      this.computeCollateralValue();
      this.computeInterestValue();
    });
  }

  onPrincipalTokenSelected(token: string) {
    // Update principals
    this.principalToken = token;
    this.createFormGroup.controls['principalAmount'].reset();
    // Update collaterals
    this.collateralToken = token === this.tokens[0] ? this.tokens[1] : this.tokens[0];
    // this.collateralValue = this.getCollateralValue();
  }

  onTenorChange(tenorChange: MatButtonToggleChange) {
    this.createFormGroup.patchValue({ 'tenor': tenorChange.value });
  }

  onCollateralTokenSelected(token: string) {
    this.collateralToken = token;
    this.createFormGroup.controls['collateralRatio'].reset();
  }

  onCollateralRatioChange(collateralRatioChange: MatButtonToggleChange) {
    this.createFormGroup.patchValue({ 'collateralRatio': collateralRatioChange.value });
  }

  onInterestRateChange(interestRateChange: MatButtonToggleChange) {
    this.createFormGroup.patchValue({ 'interestRate': interestRateChange.value });
  }

  computeCollateralValue() {
    const principalTokenAddress = this.nutsPlatformService.getTokenAddressByName(this.principalToken);
    const collateralTokenAddress = this.nutsPlatformService.getTokenAddressByName(this.collateralToken);
    if (!this.principalValue) {
      this.collateralValue = 0;
      return;
    }

    this.priceOracleSercvice.getConvertedValue(collateralTokenAddress, principalTokenAddress,
      this.principalValue * this.createFormGroup.value['collateralRatio'], 100).then(value => {
        this.collateralValue = value;
        console.log(value);
      });
  }

  async createBorrowingIssuance() {
    console.log(this.createFormGroup);
    if (!this.createFormGroup.valid || this.collateralTokenBalance < this.collateralValue) {
      return;
    }
    this.instrumentService.createBorrowingIssuance(this.principalToken, this.principalValue,
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
              instrument: 'borrowing',
              tokenAmount: this.principalValue,
              tokenName: this.principalToken,
            },
          });
          transactionInitiatedDialog.afterClosed().subscribe(() => {
            this.resetForm();
            // Scroll to top
            document.body.scrollTop = document.documentElement.scrollTop = 0;
          });
        });
      
        this.monitorBorrowingTransaction(transactionHash);  
      });
  }

  private monitorBorrowingTransaction(transactionHash) {
    // Monitoring transaction status(work around for Metamask mobile)
    const interval = setInterval(async () => {
      const receipt = await this.nutsPlatformService.web3.eth.getTransactionReceipt(transactionHash);
      if (!receipt || !receipt.blockNumber) return;

      console.log('Create receipt', receipt);
      // New borrowing issuance created. Need to refresh the borrowing issuance list.
      this.instrumentService.reloadBorrowingIssuances(5, 3000);
      // New borrowing issuance created. Need to update the principal balance as well.
      this.accountBalanceService.getUserBalanceFromBackend(5, 3000);
      this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
      clearInterval(interval);
    }, 2000);
  }

  resetForm() {
    this.principalToken = this.tokens[0];
    this.collateralToken = this.tokens[1];
    this.form.resetForm();
  }

  computeInterestValue() {
    const principalAmount = Math.floor(this.createFormGroup.value['principalAmount'] * 10000);
    const interestRate = Math.floor(this.createFormGroup.value['interestRate'] * 10000);
    const tenor = this.createFormGroup.value['tenor'];
    const interest = principalAmount * interestRate * tenor / 10000000000;
    console.log(principalAmount, interestRate, tenor, interest);

    this.interestValue = interest;
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

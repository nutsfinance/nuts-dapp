import { Component, OnInit, ViewChild, NgZone } from '@angular/core';
import { FormControl, FormGroup, NgForm } from '@angular/forms';
import { MatButtonToggleChange, MatDialog } from '@angular/material';

import { NutsPlatformService, BORROWING_NAME } from '../../../common/web3/nuts-platform.service';
import { PriceOracleService } from '../../../common/web3/price-oracle.service';
import { TransactionInitiatedDialog } from 'src/app/common/transaction-initiated-dialog/transaction-initiated-dialog.component';
import { TokenModel } from 'src/app/common/token/token.model';
import { BorrowingService } from '../borrowing.service';
import { AccountService } from 'src/app/account/account.service';
import { TokenService } from 'src/app/common/token/token.service';

@Component({
  selector: 'app-borrowing-create',
  templateUrl: './borrowing-create.component.html',
  styleUrls: ['./borrowing-create.component.scss']
})
export class BorrowingCreateComponent implements OnInit {
  @ViewChild('form', { static: true }) private form: NgForm;
  public tokens: TokenModel[] = [];

  public createFormGroup: FormGroup;
  public showAlternativeTenor = false;
  public showAlternativeColleral = false;
  public showAlternativeInterest = false;
  public principalToken: TokenModel;
  public principalValue = '0';
  public collateralTokenBalance = '0';
  public collateralTokenList: TokenModel[] = [];
  public collateralToken: TokenModel;
  public collateralValue = '0';
  public interestValue = '0';

  constructor(private nutsPlatformService: NutsPlatformService, private borrowingService: BorrowingService,
    private priceOracleSercvice: PriceOracleService, private accountService: AccountService,
    private tokenService: TokenService, private zone: NgZone, private dialog: MatDialog) { }

  ngOnInit() {
    this.createFormGroup = new FormGroup({
      'principalAmount': new FormControl('', this.validPrincipalAmount.bind(this)),
      'tenor': new FormControl('', this.validTenor),
      'collateralRatio': new FormControl('', this.validCollateralRatio),
      'interestRate': new FormControl('', this.validInterestRate),
    });
    this.createFormGroup.valueChanges.subscribe(_ => {
      this.principalValue = this.tokenService.getActualValue(this.principalToken.tokenAddress, this.createFormGroup.value['principalAmount']);
      this.borrowingService.getCollateralValue(this.principalToken, this.collateralToken, this.principalValue,
        this.createFormGroup.value['collateralRatio']).then(value => {
          this.collateralValue = value;
        });
      this.interestValue = this.borrowingService.getInterestValue(this.principalValue, this.createFormGroup.value['interestRate'],
        this.createFormGroup.value['tenor']);
    });
  }

  onPrincipalTokenSelected(tokenAddress: string) {
    // Update principals
    this.principalToken = this.tokenService.getTokenByAddress(tokenAddress);
    this.createFormGroup.controls['principalAmount'].reset();
    // Update collateral tokens
    this.collateralTokenList = this.tokens.filter(token => token.tokenAddress !== tokenAddress)
    this.collateralToken = this.collateralTokenList[0];
  }

  onTenorChange(tenorChange: MatButtonToggleChange) {
    this.createFormGroup.patchValue({ 'tenor': tenorChange.value });
  }

  onCollateralTokenSelected(tokenAddress: string) {
    this.collateralToken = this.tokenService.getTokenByAddress(tokenAddress);
    this.collateralTokenBalance = this.accountService.getAccountBalance(BORROWING_NAME, this.collateralToken.tokenAddress);
    this.createFormGroup.controls['collateralRatio'].reset();
  }

  onCollateralRatioChange(collateralRatioChange: MatButtonToggleChange) {
    this.createFormGroup.patchValue({ 'collateralRatio': collateralRatioChange.value });
  }

  onInterestRateChange(interestRateChange: MatButtonToggleChange) {
    this.createFormGroup.patchValue({ 'interestRate': interestRateChange.value });
  }

  async createBorrowingIssuance() {
    if (!this.createFormGroup.valid || this.collateralTokenBalance < this.collateralValue) {
      return;
    }
    this.borrowingService.createBorrowingIssuance(this.principalToken, this.principalValue,
      this.collateralToken, this.createFormGroup.value['collateralRatio'], this.createFormGroup.value['tenor'],
      this.createFormGroup.value['interestRate'])
      .on('transactionHash', transactionHash => {
        // Show Transaction Initiated dialog
        this.zone.run(() => {
          // Opens Engagement Initiated dialog.
          const transactionInitiatedDialog = this.dialog.open(TransactionInitiatedDialog, {
            width: '90%',
            data: {
              type: 'create_issuance', instrument: BORROWING_NAME, tokenAmount: this.principalValue, tokenName: this.principalToken.tokenSymbol,
            },
          });
          transactionInitiatedDialog.afterClosed().subscribe(() => {
            this.resetForm();
            // Scroll to top
            document.body.scrollTop = document.documentElement.scrollTop = 0;
          });
        });
      });
  }

  resetForm() {
    this.principalToken = this.tokens[0];
    this.collateralTokenList = this.tokens.slice(1);
    this.collateralToken = this.tokens[1];
    this.form.resetForm();
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
    if (Number.isNaN(Number(control.value)) || Number(control.value) <= 0) {
      return { 'nonPositiveAmount': true };
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

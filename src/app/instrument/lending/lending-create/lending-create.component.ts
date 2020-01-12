import { Component, OnInit, ViewChild } from '@angular/core';
import { MatButtonToggleChange } from '@angular/material';

import { NutsPlatformService } from '../../../common/web3/nuts-platform.service';
import { NgForm, FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-lending-create',
  templateUrl: './lending-create.component.html',
  styleUrls: ['./lending-create.component.scss']
})
export class LendingCreateComponent implements OnInit {
  @ViewChild('form', {static: true}) private form: NgForm;
  private createFormGroup: FormGroup;
  private showAlternativeTenor = false;
  private showAlternativeColleral = false;
  private showAlternativeInterest = false;
  private principalToken = 'ETH';
  private principalTokenBalance: number;
  private collateralToken = 'ETH';

  constructor(private nutsPlatformService: NutsPlatformService) { }

  ngOnInit() {
    this.createFormGroup = new FormGroup({
      'principalAmount': new FormControl('', this.validPrincipalAmount.bind(this)),
      'tenor': new FormControl('', this.validTenor),
      'collateralRatio': new FormControl('', this.validCollateralRatio),
      'interestRate': new FormControl('', this.validInterestRate),
    });
  }

  onPrincipalTokenSelected(token: string) {
    this.principalToken = token;
    this.createFormGroup.controls['principalAmount'].reset();
  }

  onTenorChange(tenorChange: MatButtonToggleChange) {
    this.createFormGroup.patchValue({'tenor': tenorChange.value});
  }

  onCollateralTokenSelected(token: string) {
    this.collateralToken = token;
    this.createFormGroup.controls['collateralRatio'].reset();
  }

  onCollateralRatioChange(collateralRatioChange: MatButtonToggleChange) {
    this.createFormGroup.patchValue({'collateralRatio': collateralRatioChange.value});
  }

  onInterestRateChange(interestRateChange: MatButtonToggleChange) {
    this.createFormGroup.patchValue({'interestRate': interestRateChange.value});
  }

  async createLendingIssuance() {
    console.log(this.createFormGroup);
    if (!this.createFormGroup.valid) {
      return;
    }
    const result = await this.nutsPlatformService.createLendingIssuance(this.principalToken, 
      this.createFormGroup.value['principalAmount'], this.collateralToken,
      this.createFormGroup.value['collateralRatio'], this.createFormGroup.value['tenor'],
      this.createFormGroup.value['interestRate']);
    console.log(result);
  }

  resetForm() {
    this.principalToken = 'ETH';
    this.collateralToken = 'ETH';
    this.form.resetForm();
  }

  getInterest(): number {
    const principalAmount = this.createFormGroup.value['principalAmount'];
    const interestRate = this.createFormGroup.value['interestRate'];
    const tenor = this.createFormGroup.value['tenor'];
    const interest = principalAmount * interestRate * tenor / 100;

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

  validPrincipalAmount(control: FormControl): {[s: string]: boolean} {
    if (!control.value) {
      return {'required': true};
    }
    if (this.principalTokenBalance < Number(control.value)) {
      return {'insufficientBalance': true};
    }
    if (Number(control.value) <= 0) {
      return {'nonPositiveAmount': true};
    }
    if (this.principalToken !== 'ETH' && !/^[1-9][0-9]*$/.test(control.value)) {
      return {'nonIntegerAmount': true};
    }
    return null;
  }

  validTenor(control: FormControl): {[s: string]: boolean} {
    if (!control.value) {
      return {'required': true};
    }
    if (!/^[1-9][0-9]*$/.test(control.value)) {
      return {'nonIntegerAmount': true};
    }
    if (Number(control.value) < 2 || Number(control.value) > 90) {
      return {'invalidValue': true};
    }
    return null;
  }

  validCollateralRatio(control: FormControl): {[s: string]: boolean} {
    if (!control.value) {
      return {'required': true};
    }
    if (Number(control.value) < 50 || Number(control.value) > 200) {
      return {'invalidValue': true};
    }
    return null;
  }

  validInterestRate(control: FormControl): {[s: string]: boolean} {
    if (!control.value) {
      return {'required': true};
    }
    if (Number(control.value) < 0.01 || Number(control.value) > 5) {
      return {'invalidValue': true};
    }
    return null;
  }
}

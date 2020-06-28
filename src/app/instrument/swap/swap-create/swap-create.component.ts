import { Component, OnInit, ViewChild, NgZone } from '@angular/core';
import { FormControl, FormGroup, NgForm } from '@angular/forms';
import { MatButtonToggleChange, MatDialog } from '@angular/material';
import { NutsPlatformService, SWAP_NAME } from '../../../common/web3/nuts-platform.service';
import { TransactionInitiatedDialog } from 'src/app/common/transaction-initiated-dialog/transaction-initiated-dialog.component';
import { TokenModel } from 'src/app/common/token/token.model';
import { SwapService } from '../swap.service';
import { TokenService } from 'src/app/common/token/token.service';

@Component({
  selector: 'app-swap-create',
  templateUrl: './swap-create.component.html',
  styleUrls: ['./swap-create.component.scss']
})
export class SwapCreateComponent implements OnInit {
  @ViewChild('form', { static: true }) private form: NgForm;

  public tokens: TokenModel[] = [];
  public createFormGroup: FormGroup;
  public inputToken: TokenModel;
  public outputTokenList: TokenModel[] = [];
  public outputToken: TokenModel;
  public inputTokenBalance = '';
  public showAlternativeTenor = false;

  constructor(private nutsPlatformService: NutsPlatformService, private swapService: SwapService,
    private tokenService: TokenService, private zone: NgZone, private dialog: MatDialog) { }

  ngOnInit() {
    this.tokens = this.tokenService.tokens.filter(token => token.supportsTransaction);
    this.inputToken = this.tokens[0];
    this.outputTokenList = this.tokens.slice(1);
    this.outputToken = this.tokens[1];
    this.createFormGroup = new FormGroup({
      'inputAmount': new FormControl('', this.validInputAmount.bind(this)),
      'outputAmount': new FormControl('', this.validOutputAmount.bind(this)),
      'duration': new FormControl('', this.validDurtion),
    });
  }

  onInputTokenSelected(tokenSelected: TokenModel) {
    this.inputToken = tokenSelected;
    this.createFormGroup.controls['inputAmount'].reset();
    // Update output tokens
    this.outputTokenList = this.tokens.filter(token => token.tokenAddress !== tokenSelected.tokenAddress);
    this.outputToken = this.outputTokenList[0];
  }

  onOutputTokenSelected(token: TokenModel) {
    this.outputToken = token;
  }

  onTenorChange(tenorChange: MatButtonToggleChange) {
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

    const inputAmount = this.tokenService.getActualValue(this.inputToken.tokenAddress, this.createFormGroup.value['inputAmount']);
    const outputAmount = this.tokenService.getActualValue(this.outputToken.tokenAddress, this.createFormGroup.value['outputAmount']);
    this.swapService.createSwapIssuance(this.inputToken, this.outputToken, inputAmount, outputAmount, this.createFormGroup.value['duration'])
      .on('transactionHash', transactionHash => {
        // Show Transaction Initiated dialog
        this.zone.run(() => {
          // Opens Engagement Initiated dialog.
          const transactionInitiatedDialog = this.dialog.open(TransactionInitiatedDialog, {
            width: '90%',
            data: {
              type: 'create_issuance', instrument: SWAP_NAME, token: this.inputToken, tokenAmount: inputAmount,
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
    this.inputToken = this.tokens[0];
    this.outputTokenList = this.tokens.slice(1);
    this.outputToken = this.tokens[1];
    this.form.resetForm();
  }

  validInputAmount(control: FormControl): { [s: string]: boolean } {
    if (!control.value) {
      return { 'required': true };
    }
    const inputAmount = this.tokenService.getActualValue(this.inputToken.tokenAddress, control.value);
    const BN = this.nutsPlatformService.web3.utils.BN;
    if (new BN(this.inputTokenBalance).lt(new BN(inputAmount))) {
      return { 'insufficientBalance': true };
    }
    if ((Number.isNaN(Number(control.value))) || Number(control.value) <= 0) {
      return { 'nonPositiveAmount': true };
    }
    return null;
  }

  validOutputAmount(control: FormControl): { [s: string]: boolean } {
    if (!control.value) {
      return { 'required': true };
    }
    if ((Number.isNaN(Number(control.value))) || Number(control.value) <= 0) {
      return { 'nonPositiveAmount': true };
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

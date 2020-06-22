import { Component, Input, Output, EventEmitter, OnInit, OnChanges, ViewChild, NgZone, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, NgForm } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { AccountService } from '../account.service';
import { FSP_NAME, NutsPlatformService } from '../../common/web3/nuts-platform.service';
import { TransactionInitiatedDialog } from 'src/app/common/transaction-initiated-dialog/transaction-initiated-dialog.component';
import { TokenService } from 'src/app/common/token/token.service';
import { TokenModel } from 'src/app/common/token/token.model';

@Component({
  selector: 'app-account-deposit',
  templateUrl: './account-deposit.component.html',
  styleUrls: ['./account-deposit.component.scss']
})
export class AccountDepositComponent implements OnInit, OnChanges {
  @Input() public instrument: string;
  @Input() public selectedToken: TokenModel;
  @Input() public amount: string;
  @Output() public approveToken = new EventEmitter<TokenModel>();

  public includedTokens: TokenModel[] = [];
  public walletBalance: string;
  public amountControl: FormControl;
  public depositFormGroup: FormGroup;
  public showApprove = false;

  @ViewChild('form', { static: true }) private form: NgForm;

  constructor(private dialog: MatDialog, private zone: NgZone, private nutsPlatformService: NutsPlatformService, 
    private accountService: AccountService, private tokenService: TokenService) {
    this.amountControl = new FormControl(this.amount, this.validBalance.bind(this));
    this.depositFormGroup = new FormGroup({ amount: this.amountControl });
  }

  ngOnInit() {
    this.includedTokens = this.tokenService.tokens.filter(token => token.supportsTransaction);
    // If no token is selected, select the first one!
    if (!this.selectedToken) {
      this.selectedToken = this.includedTokens[0];
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    this.depositFormGroup.patchValue({ amount: this.amount });
  }

  onTokenSelected(token: TokenModel) {
    this.form.reset();
    this.selectedToken = token;
    if (token.tokenAddress.toLowerCase() == this.nutsPlatformService.getWETH().toLowerCase()) {
      this.showApprove = false;
      this.approveToken.next(null);
      this.amountControl.enable();
    } else {
      this.tokenService.getWalletAllowance(this.instrument, token.tokenAddress).then(allowance => {
        console.log('Allowance for ', this.selectedToken.tokenSymbol, allowance);
        if (allowance) {
          this.showApprove = false;
          this.approveToken.next(null);
          this.amountControl.enable();
        } else {
          this.showApprove = true;
          this.approveToken.next(this.selectedToken);
          this.amountControl.disable();
        }
      });
    }
  }

  setMaxAmount() {
    if (this.amountControl.enabled) {
      this.depositFormGroup.patchValue({
        amount: this.tokenService.getDisplayValue(this.selectedToken.tokenAddress, this.walletBalance),
      });
    }
  }

  submit() {
    if (this.depositFormGroup.invalid) {
      return;
    }
    if (this.showApprove) {
      this.approve();
    } else {
      this.deposit();
    }
  }

  validBalance(control: FormControl): { [s: string]: boolean } {
    if (!control.value) {
      return { 'required': true };
    }
    const value = Number(control.value);
    if (Number.isNaN(value) || value <= 0) {
      return { 'nonPositiveAmount': true };
    }

    const BN = this.nutsPlatformService.web3.utils.BN;
    if (new BN(this.walletBalance).lt(new BN(this.tokenService.getActualValue(this.selectedToken.tokenAddress, control.value)))) {
      return { 'insufficientBalance': true };
    }
    
    return null;
  }

  private approve() {
    this.accountService.approve(this.instrument, this.selectedToken.tokenAddress)
      .on('transactionHash', transactionHash => {
        this.zone.run(() => {
          // Opens Approval Initiated dialog.
          const transactionInitiatedDialog = this.dialog.open(TransactionInitiatedDialog, {
            width: '90%',
            data: { type: 'approve', fspName: FSP_NAME, token: this.selectedToken }
          });

          transactionInitiatedDialog.afterClosed().subscribe(() => {
            // Scroll to top
            document.body.scrollTop = document.documentElement.scrollTop = 0;
          });
        });

        // Monitoring transaction status(work around for Metamask mobile)
        const interval = setInterval(async () => {
          const receipt = await this.nutsPlatformService.web3.eth.getTransactionReceipt(transactionHash);
          if (!receipt || !receipt.blockNumber) return;

          // Once the Approve transaction is successful, enables the button
          setTimeout(() => {
            this.tokenService.getWalletAllowance(this.instrument, this.selectedToken.tokenAddress).then(allowance => {
              console.log('Allowance for', this.selectedToken, allowance);
              this.showApprove = false;
              this.approveToken.next(null);
              this.amountControl.enable();
              this.amountControl.markAsPristine();
            });
          }, 2000);
          this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
          clearInterval(interval);
        }, 4000);
      });
  }

  private deposit() {
    const depositValue = this.tokenService.getActualValue(this.selectedToken.tokenAddress, this.amountControl.value);
    let depositPromise;
    if (this.selectedToken.tokenAddress === this.nutsPlatformService.getWETH()) {
      depositPromise = this.accountService.depositETH(this.instrument, depositValue);
    } else {
      depositPromise = this.accountService.depositToken(this.instrument, this.selectedToken.tokenAddress, depositValue);
    }
    depositPromise.on('transactionHash', transactionHash => {
      this.zone.run(() => {
        // Opens Deposit Initiated dialog.
        const transactionInitiatedDialog = this.dialog.open(TransactionInitiatedDialog, {
          width: '90%',
          data: { type: 'deposit', fspName: FSP_NAME, token: this.selectedToken, tokenAmount: depositValue }
        });
        transactionInitiatedDialog.afterClosed().subscribe(() => {
          this.form.resetForm();
          // Scroll to top
          document.body.scrollTop = document.documentElement.scrollTop = 0;
        });
      });

      // Monitoring transaction status(work around for Metamask mobile)
      const interval = setInterval(async () => {
        const receipt = await this.nutsPlatformService.web3.eth.getTransactionReceipt(transactionHash);
        if (!receipt || !receipt.blockNumber) return;
        console.log('Deposit ETH receipt', receipt);

        // Update instrument balance
        this.accountService.refreshAccountBalance(this.instrument, 5, 3000);
        this.nutsPlatformService.transactionConfirmedSubject.next(receipt.transactionHash);
        clearInterval(interval);
      }, 4000);
    })
      .on('error', console.error);
  }
}
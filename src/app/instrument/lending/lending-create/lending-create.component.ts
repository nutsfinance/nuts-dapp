import { Component, OnInit } from '@angular/core';
import { MatButtonToggleChange } from '@angular/material';

import { NutsPlatformService } from '../../../common/web3/nuts-platform.service';

@Component({
  selector: 'app-lending-create',
  templateUrl: './lending-create.component.html',
  styleUrls: ['./lending-create.component.scss']
})
export class LendingCreateComponent implements OnInit {
  private showAlternativeTenor = false;
  private showAlternativeColleral = false;
  private showAlternativeInterest = false;
  private principalToken = 'ETH';
  private principalAmount = '';
  private collateralToken = 'ETH';
  private tenor: number = 0;
  private collateralRatio: number = 0;
  private interestRate: number = 0;

  constructor(private nutsPlatformService: NutsPlatformService) { }

  ngOnInit() {
  }

  onPrincipalTokenSelected(token: string) {
    this.principalToken = token;
  }

  onCollateralTokenSelected(token: string) {
    this.collateralToken = token;
  }

  onTenorChange(tenorChange: MatButtonToggleChange) {
    console.log(tenorChange.value);
    this.tenor = tenorChange.value;
  }

  onCollateralRatioChange(collateralRatioChange: MatButtonToggleChange) {
    this.collateralRatio = collateralRatioChange.value;
  }

  onInterestRateChange(interestRateChange: MatButtonToggleChange) {
    this.interestRate = interestRateChange.value;
  }

  async createLendingIssuance() {
    const result = await this.nutsPlatformService.createLendingIssuance(this.principalToken, Number(this.principalAmount), this.collateralToken,
      this.collateralRatio, this.tenor, this.interestRate);
    console.log(result);
  }

  resetForm() {
    this.principalToken = 'ETH';
    this.principalAmount = '';
    this.collateralToken = 'ETH';
    this.collateralRatio = 0;
    this.tenor = 0;
    this.interestRate = 0;
  }
}

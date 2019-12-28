import { Component, OnInit } from '@angular/core';
import { MatButtonToggleChange } from '@angular/material';

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
  private collateralToken = 'ETH';
  private tenor: number;
  private collateralRatio: number;
  private interestRate: number;

  constructor() { }

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

}

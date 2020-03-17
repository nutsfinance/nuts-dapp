import { Component, OnInit } from '@angular/core';
import { MatButtonToggleChange } from '@angular/material';

@Component({
  selector: 'app-borrowing-create',
  templateUrl: './borrowing-create.component.html',
  styleUrls: ['./borrowing-create.component.scss']
})
export class BorrowingCreateComponent implements OnInit {
  public showAlternativeTenor = false;
  public showAlternativeColleral = false;
  public showAlternativeInterest = false;
  public principalToken = 'ETH';
  public collateralToken = 'ETH';
  public tenor: number;
  public collateralRatio: number;
  public interestRate: number;

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

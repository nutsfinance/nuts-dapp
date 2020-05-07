import { Component, OnInit } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

import { CurrencySelectSheetComponent } from './currency-select-sheet.component';
import { CurrencyService } from './currency.service';

@Component({
  selector: 'app-currency-select',
  templateUrl: './currency-select.component.html',
  styleUrls: ['./currency-select.component.scss']
})
export class CurrencySelectComponent implements OnInit {
  public currency = 'USD';

  constructor(private _bottomSheet: MatBottomSheet, private currencyService: CurrencyService) {}

  ngOnInit() {
    this.currency = this.currencyService.currency;
  }

  openBottomSheet(): void {
    const bottomSheetRef = this._bottomSheet.open(CurrencySelectSheetComponent);
    bottomSheetRef.afterDismissed().subscribe((currency) => {
      if (currency && this.currency != currency) {
        this.currency = currency;
        this.currencyService.setCurrency(currency);
      }
    });
  }
}

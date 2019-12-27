import { Component, OnInit } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

import { CurrencySelectSheetComponent } from './currency-select-sheet.component';

@Component({
  selector: 'app-currency-select',
  templateUrl: './currency-select.component.html',
  styleUrls: ['./currency-select.component.scss']
})
export class CurrencySelectComponent implements OnInit {
  private currency = 'USD';

  constructor(private _bottomSheet: MatBottomSheet) {}

  ngOnInit() {
  }

  openBottomSheet(): void {
    this._bottomSheet.open(CurrencySelectSheetComponent);
  }
}

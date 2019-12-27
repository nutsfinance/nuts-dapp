import { Component } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { CurrencySelectComponent } from './currency-select.component';

@Component({
    selector: 'app-currency-select-sheet',
    templateUrl: 'currency-select-sheet.component.html',
})
export class CurrencySelectSheetComponent {
    constructor(private _bottomSheetRef: MatBottomSheetRef<CurrencySelectComponent>) { }

    selectCurrency(currency: string): void {
        console.log(currency);
        this._bottomSheetRef.dismiss();
        event.preventDefault();
    }
}
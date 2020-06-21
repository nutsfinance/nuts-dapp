import { Component, Inject } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { TokenSelectComponent } from './token-select.component';

@Component({
  selector: 'app-token-select-sheet',
  templateUrl: 'token-select-sheet.component.html',
  styleUrls: ['token-select-sheet.component.scss'],
})
export class TokenSelectSheetComponent {
  constructor(private _bottomSheetRef: MatBottomSheetRef<TokenSelectComponent>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: any) {
  }

  selectToken(tokenAddress: string): void {
    this._bottomSheetRef.dismiss(tokenAddress);
    event.preventDefault();
  }
}

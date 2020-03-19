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
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: any) { }

  isTokenExcluded(token) {
    return this.data.excludedTokens && this.data.excludedTokens.includes(token);
  }

  selectToken(token: string): void {
    this._bottomSheetRef.dismiss(token);
    event.preventDefault();
  }
}

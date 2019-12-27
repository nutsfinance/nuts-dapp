import {Component} from '@angular/core';
import {MatBottomSheetRef} from '@angular/material/bottom-sheet';
import {TokenSelectComponent} from './token-select.component';

@Component({
  selector: 'app-token-select-sheet',
  templateUrl: 'token-select-sheet.component.html',
  styleUrls: ['token-select-sheet.component.scss'],
})
export class TokenSelectSheetComponent {
  constructor(private _bottomSheetRef: MatBottomSheetRef<TokenSelectComponent>) {}

  selectToken(token: string): void {
    console.log(token);
    this._bottomSheetRef.dismiss(token);
    event.preventDefault();
  }
}

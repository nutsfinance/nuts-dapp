import {Component} from '@angular/core';
import {MatBottomSheetRef} from '@angular/material/bottom-sheet';
import {AppComponent} from './app.component';

@Component({
  selector: 'app-language-select-sheet',
  templateUrl: './language-select-sheet.component.html'
})
export class LanguageSelectSheetComponent {

  constructor(private _bottomSheetRef: MatBottomSheetRef<AppComponent>) {}

  selectLanguage(language: string): void {
    console.log(language);
    this._bottomSheetRef.dismiss(language);
    event.preventDefault();
  }

}

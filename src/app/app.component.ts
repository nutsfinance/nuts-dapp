import {Component} from '@angular/core';
import {MatBottomSheet} from '@angular/material/bottom-sheet';
import {LanguageSelectSheetComponent} from './language-select-sheet.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  private language: string = 'English';
  constructor(private _bottomSheet: MatBottomSheet) {}

  openLanguageBottomSheet(): void {
    this._bottomSheet.open(LanguageSelectSheetComponent);

    const bottomSheetRef = this._bottomSheet.open(LanguageSelectSheetComponent);
    bottomSheetRef.afterDismissed().subscribe(language => {
      // Ignore if the bottom sheet is closed by clicking empty spaces.
      if (language) {
        console.log(language);
        this.language = language;
      }
    });
  }


}

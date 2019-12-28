import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {MatBottomSheet} from '@angular/material/bottom-sheet';
import {TokenSelectSheetComponent} from './token-select-sheet.component';


@Component({
  selector: 'app-token-select',
  templateUrl: './token-select.component.html',
  styleUrls: ['./token-select.component.scss']
})
export class TokenSelectComponent implements OnInit {
  private selectedToken = 'ETH';
  @Output() tokenSelected = new EventEmitter<string>();

  constructor(private _bottomSheet: MatBottomSheet) {}

  ngOnInit() {
  }

  openBottomSheet() {
    const bottomSheetRef = this._bottomSheet.open(TokenSelectSheetComponent);
    bottomSheetRef.afterDismissed().subscribe(token => {
      this.selectedToken = token;
      this.tokenSelected.emit(token);
    });
  }

}

import { Component, EventEmitter, OnInit, Output, Input } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { TokenSelectSheetComponent } from './token-select-sheet.component';
import { TokenService } from '../token.service';
import { TokenModel } from '../token.model';


@Component({
  selector: 'app-token-select',
  templateUrl: './token-select.component.html',
  styleUrls: ['./token-select.component.scss']
})
export class TokenSelectComponent implements OnInit {
  @Input() public selectedToken: TokenModel;   // The token that is already selectee.
  @Input() public includedTokens: TokenModel[] = [];    // The token that should be included in the selection list.
  @Input() public disabled = false;       // Whether the token select is disabled.
  @Input() public borderless = false;     // Whether the token select is borderless
  @Output() public tokenSelected = new EventEmitter<TokenModel>();
  public tokenIconUrl = '';

  constructor(private _bottomSheet: MatBottomSheet, private tokenService: TokenService) { }

  ngOnInit() {
    this.tokenIconUrl = this.tokenService.getTokenIconUrl(this.selectedToken);
  }

  openBottomSheet() {
    if (this.disabled) return;
    const bottomSheetRef = this._bottomSheet.open(TokenSelectSheetComponent, {
      data: {
        tokens: this.includedTokens
      }
    });
    bottomSheetRef.afterDismissed().subscribe(tokenAddress => {
      // Ignore if the bottom sheet is closed by clicking empty spaces.
      if (tokenAddress) {
        this.selectedToken = this.tokenService.getTokenByAddress(tokenAddress);
        this.tokenIconUrl = this.tokenService.getTokenIconUrl(this.selectedToken);
        this.tokenSelected.emit(this.selectedToken);
      }
    });
  }

}

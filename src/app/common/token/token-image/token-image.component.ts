import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { TokenService } from '../token.service';
import { TokenModel } from '../token.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-token-image',
  templateUrl: './token-image.component.html',
  styleUrls: ['./token-image.component.scss']
})
export class TokenImageComponent implements OnInit, OnDestroy {
  @Input() token: TokenModel;
  public tokenIconUrl = '';

  private tokenSubscription: Subscription;

  constructor(private tokenService: TokenService) { }

  ngOnInit() {
    this.tokenIconUrl = this.tokenService.getTokenIconUrl(this.token);
    this.tokenSubscription = this.tokenService.tokensUpdatedSubject.subscribe(_ => {
      this.tokenIconUrl = this.tokenService.getTokenIconUrl(this.token);
    });
  }

  ngOnDestroy() {
    this.tokenSubscription.unsubscribe();
  }
}

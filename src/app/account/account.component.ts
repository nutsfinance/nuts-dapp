import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { ActivatedRoute, Data } from '@angular/router';
import { Subscription } from 'rxjs';
import { TokenModel } from '../common/token/token.model';
import { TokenService } from '../common/token/token.service';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit, OnDestroy {
  public instrument: string;
  public panel = 'deposit';
  public token: TokenModel;
  public amount = '';
  public approveToken: TokenModel;

  private routeDataSubscription: Subscription;
  private routeParamSubscription: Subscription;

  constructor(private route: ActivatedRoute, private tokenService: TokenService, private zone: NgZone) { }

  ngOnInit() {
    this.instrument = this.route.snapshot.data['instrument'];
    this.panel = this.route.snapshot.queryParams['panel'] || 'deposit';
    this.token = this.tokenService.getTokenByAddress(this.route.snapshot.queryParams['tokenAddress']);
    this.amount = this.route.snapshot.queryParams['amount'] || '';

    this.routeDataSubscription = this.route.data.subscribe((data: Data) => {
      this.instrument = data['instrument'];
    });
    this.routeParamSubscription = this.route.queryParams.subscribe(queryParams => {
      this.panel = queryParams['panel'] || 'deposit';
      this.token = this.tokenService.getTokenByAddress(queryParams['tokenAddress']);
      this.amount = queryParams['amount'] || '';
    });
  }

  ngOnDestroy() {
    this.routeDataSubscription.unsubscribe();
    this.routeParamSubscription.unsubscribe();
  }
}

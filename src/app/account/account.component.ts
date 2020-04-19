import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { ActivatedRoute, Data } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit, OnDestroy {
  public instrument: string;
  public panel = 'deposit';
  public token = 'ETH';
  public amount = '';
  public approveToken = '';

  private routeDataSubscription: Subscription;
  private routeParamSubscription: Subscription;

  constructor(private route: ActivatedRoute, private zone: NgZone) { }

  ngOnInit() {
    this.instrument = this.route.snapshot.data['instrument'];
    this.panel = this.route.snapshot.queryParams['panel'] || 'deposit';
    this.token = this.route.snapshot.queryParams['token'] || 'ETH';
    this.amount = this.route.snapshot.queryParams['amount'] || '';

    this.routeDataSubscription = this.route.data.subscribe((data: Data) => {
      this.instrument = data['instrument'];
    });
    this.routeParamSubscription = this.route.queryParams.subscribe(queryParams => {
      this.panel = queryParams['panel'] || 'deposit';
      this.token = queryParams['token'] || 'ETH';
      this.amount = queryParams['amount'] || '';
    });
  }

  ngOnDestroy() {
    this.routeDataSubscription.unsubscribe();
    this.routeParamSubscription.unsubscribe();
  }
}

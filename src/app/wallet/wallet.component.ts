import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { ActivatedRoute, Data } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.scss']
})
export class WalletComponent implements OnInit, OnDestroy {
  private instrument: string;
  private routeDataSubscription: Subscription;
  private panel = 'deposit';
  private token = 'ETH';
  private amount = '';
  private showApprove = false;
  private routeParamSubscription: Subscription;

  constructor(private route: ActivatedRoute, private zone: NgZone) { }

  ngOnInit() {
    this.instrument = this.route.snapshot.data['instrument'];
    this.panel = this.route.snapshot.queryParams['panel'] || 'deposit';
    this.token = this.route.snapshot.queryParams['token'] || 'ETH';
    this.amount = this.route.snapshot.queryParams['amount'] || '';
    this.showApprove = this.route.snapshot.queryParams['showApprove'] ? this.route.snapshot.queryParams['showApprove'].toLowerCase() === 'true' : this.token !== 'ETH';

    this.routeDataSubscription = this.route.data.subscribe((data: Data) => {
      this.instrument = data['instrument'];
    });
    this.routeParamSubscription = this.route.queryParams.subscribe(queryParams => {
      console.log(queryParams);
      this.panel = queryParams['panel'] || 'deposit';
      this.token = queryParams['token'] || 'ETH';
      this.amount = queryParams['amount'] || '';
      this.showApprove = queryParams['showApprove'] ?  queryParams['showApprove'].toLowerCase() === 'true' : this.token !== 'ETH';
    });
  }

  ngOnDestroy() {
    this.routeDataSubscription.unsubscribe();
    this.routeParamSubscription.unsubscribe();
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
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

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    this.instrument = this.route.snapshot.data['instrument'];
    console.log(this.instrument);
    this.routeDataSubscription = this.route.data.subscribe((data: Data) => {
      this.instrument = data['instrument'];
    });
  }

  ngOnDestroy() {
    this.routeDataSubscription.unsubscribe();
  }

}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { NutsPlatformService } from '../web3/nuts-platform.service';

@Component({
  selector: 'app-network-toolbar',
  templateUrl: './network-toolbar.component.html',
  styleUrls: ['./network-toolbar.component.scss']
})
export class NetworkToolbarComponent implements OnInit {
  private network: number;
  private networkSubscription: Subscription;

  constructor(private nutsPlatformService_ : NutsPlatformService) { }

  ngOnInit() {
    this.network = this.nutsPlatformService_.currentNetwork;
    this.networkSubscription = this.nutsPlatformService_.currentNetworkSubject.subscribe(network => {
      this.network = network;
    });
  }

  ngOnDestroy() {
    this.networkSubscription.unsubscribe();
  }
}

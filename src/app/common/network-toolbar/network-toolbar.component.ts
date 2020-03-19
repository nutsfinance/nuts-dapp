import {Component, NgZone, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {NutsPlatformService} from '../web3/nuts-platform.service';


@Component({
  selector: 'app-network-toolbar',
  templateUrl: './network-toolbar.component.html',
  styleUrls: ['./network-toolbar.component.scss']
})
export class NetworkToolbarComponent implements OnInit {
  public network: string = '';
  public account: string = '';
  
  private networkSubscription: Subscription;
  private accountSubscription: Subscription;

  constructor(public nutsPlatformService_: NutsPlatformService, private ngZone_: NgZone) {}

  ngOnInit() {
    this.network = this.nutsPlatformService_.currentNetwork;
    this.account = this.nutsPlatformService_.currentAccount;
    this.networkSubscription = this.nutsPlatformService_.currentNetworkSubject.subscribe(network => {
      this.ngZone_.run(() => {
        this.network = network;
      });
    });
    this.accountSubscription = this.nutsPlatformService_.currentAccountSubject.subscribe(account => {
      this.ngZone_.run(() => {
        this.account = account;
      });
    });
  }

  ngOnDestroy() {
    this.networkSubscription.unsubscribe();
    this.accountSubscription.unsubscribe();
  }

  reconnect() {
    this.nutsPlatformService_.connectToEthereum();
  }
}

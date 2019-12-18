import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { NutsPlatformService } from '../web3/nuts-platform.service';

@Component({
  selector: 'app-account-address',
  templateUrl: './account-address.component.html',
  styleUrls: ['./account-address.component.scss']
})
export class AccountAddressComponent implements OnInit {

  private currentAccountSubscription_: Subscription;
  private currentAccount_: string;

  constructor(private _nutsPlatformService: NutsPlatformService) { }

  ngOnInit() {
    this.currentAccountSubscription_ = this._nutsPlatformService.currentAccountSubject
      .subscribe((currentAccount) => {
        this.currentAccount_ = currentAccount;
      });
  }

  ngOnDestroy() {
    this.currentAccountSubscription_.unsubscribe();
  }

  public getCurrentAccountAddress() {
    if (!this.currentAccount_) {
      return 'N/A';
    } else {
      return `${this.currentAccount_.slice(0, 5)}....${this.currentAccount_.slice(this.currentAccount_.length - 5)}`;
    }
  }
}

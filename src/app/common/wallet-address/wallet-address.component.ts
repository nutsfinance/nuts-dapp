import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { NutsPlatformService } from '../web3/nuts-platform.service';


@Component({
  selector: 'app-wallet-address',
  templateUrl: './wallet-address.component.html',
  styleUrls: ['./wallet-address.component.scss']
})
export class WalletAddressComponent implements OnInit {

  private currentAccountSubscription_: Subscription;
  private currentAccount_: string;

  constructor(private nutsPlatformService_: NutsPlatformService) { }

  ngOnInit() {
    this.currentAccount_ = this.nutsPlatformService_.currentAccount;
    this.currentAccountSubscription_ = this.nutsPlatformService_.currentAccountSubject
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
      return `${this.currentAccount_.slice(0, 6)}....${this.currentAccount_.slice(this.currentAccount_.length - 4)}`;
    }
  }
}

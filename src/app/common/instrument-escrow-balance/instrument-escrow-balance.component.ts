import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, NgZone } from '@angular/core';
import { NutsPlatformService } from '../web3/nuts-platform.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-instrument-escrow-balance',
  templateUrl: './instrument-escrow-balance.component.html',
  styleUrls: ['./instrument-escrow-balance.component.scss']
})
export class InstrumentEscrowBalanceComponent implements OnInit, OnChanges, OnDestroy {
  @Input() private selectedToken: string;
  @Input() private instrument: string;
  @Output() private balanceUpdated = new EventEmitter<number>();
  private tokenBalance: number;
  private networkSubscription: Subscription;
  private accountSubscription: Subscription;
  private balanceSubscription: Subscription;

  constructor(private nutsPlatformService_: NutsPlatformService, private zone: NgZone) { }

  ngOnInit() {
    this.updateTokenBalance();
    this.networkSubscription = this.nutsPlatformService_.currentNetworkSubject.subscribe(() => {
      this.updateTokenBalance();
    });
    this.accountSubscription = this.nutsPlatformService_.currentAccountSubject.subscribe(() => {
      this.updateTokenBalance();
    });
    this.balanceSubscription = this.nutsPlatformService_.balanceUpdatedSubject.subscribe((token) => {
      if (token === this.selectedToken) {
        this.updateTokenBalance();
      }
    });
  }

  ngOnDestroy() {
    this.networkSubscription.unsubscribe();
    this.accountSubscription.unsubscribe();
    this.balanceSubscription.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.selectedToken = changes.selectedToken.currentValue;
    this.updateTokenBalance();
  }

  private updateTokenBalance() {
    this.nutsPlatformService_.getInstrumentEscrowBalance(this.instrument, this.selectedToken).then(balance => {
      this.zone.run(() => {
        this.tokenBalance = balance;
        this.balanceUpdated.next(balance);
      });
    });
  }

}

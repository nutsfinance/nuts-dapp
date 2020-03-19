import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, NgZone } from '@angular/core';
import { Subscription } from 'rxjs';

import { NutsPlatformService } from '../web3/nuts-platform.service';
import { InstrumentEscrowService } from '../web3/instrument-escrow.service';
import { UserBalanceService } from '../web3/user-balance.service';

@Component({
  selector: 'app-instrument-escrow-balance',
  templateUrl: './instrument-escrow-balance.component.html',
  styleUrls: ['./instrument-escrow-balance.component.scss']
})
export class InstrumentEscrowBalanceComponent implements OnInit, OnChanges, OnDestroy {
  @Input() public selectedToken: string;
  @Input() public instrument: string;
  @Output() public balanceUpdated = new EventEmitter<number>();
  public tokenBalance: number;
  
  private networkSubscription: Subscription;
  private accountSubscription: Subscription;
  private userBalanceSubscription: Subscription;

  constructor(private nutsPlatformService_: NutsPlatformService, private instrumentEscrowService: InstrumentEscrowService,
    private userBalanceService: UserBalanceService, private zone: NgZone) { }

  ngOnInit() {
    this.updateTokenBalance();
    this.networkSubscription = this.nutsPlatformService_.currentNetworkSubject.subscribe(() => {
      this.updateTokenBalance();
    });
    this.accountSubscription = this.nutsPlatformService_.currentAccountSubject.subscribe(() => {
      this.updateTokenBalance();
    });
    this.userBalanceSubscription = this.userBalanceService.userBalanceSubject.subscribe(userBalance => {
      console.log('Instrument escrow balance: User balance updated', userBalance);
      this.updateTokenBalance();
    });
  }

  ngOnDestroy() {
    this.networkSubscription.unsubscribe();
    this.accountSubscription.unsubscribe();
    this.userBalanceSubscription.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.selectedToken = changes.selectedToken.currentValue;
    this.updateTokenBalance();
  }

  private updateTokenBalance() {
    this.instrumentEscrowService.getWalletBalance(this.instrument, this.selectedToken).then(balance => {
      this.zone.run(() => {
        this.tokenBalance = balance;
        this.balanceUpdated.next(balance);
      });
    });
  }

}

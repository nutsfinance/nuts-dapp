import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, NgZone } from '@angular/core';
import { Subscription } from 'rxjs';

import { AccountBalanceService } from '../web3/account-balance.service';

@Component({
  selector: 'app-account-balance',
  templateUrl: './account-balance.component.html',
  styleUrls: ['./account-balance.component.scss']
})
export class AccountBalanceComponent implements OnInit, OnChanges, OnDestroy {
  @Input() public selectedToken: string;
  @Input() public instrument: string;
  @Output() public balanceUpdated = new EventEmitter<number>();
  public tokenBalance: number;
  
  private accountBalancesSubscription: Subscription;

  constructor(private accountBalanceService: AccountBalanceService, private zone: NgZone) { }

  ngOnInit() {
    this.accountBalancesSubscription = this.accountBalanceService.accountBalancesSubject.subscribe(accountBalances => {
      this.zone.run(() => {
        console.log('Account balance: Account balances updated', accountBalances);
        this.tokenBalance = accountBalances[this.instrument] && accountBalances[this.instrument][this.selectedToken] ?
          accountBalances[this.instrument][this.selectedToken] : 0;
        this.balanceUpdated.next(this.tokenBalance);
      });
    });
  }

  ngOnDestroy() {
    this.accountBalancesSubscription.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.tokenBalance = this.accountBalanceService.accountBalances[this.instrument] ?
      this.accountBalanceService.accountBalances[this.instrument][this.selectedToken] : 0;
    this.balanceUpdated.next(this.tokenBalance);
  }
}

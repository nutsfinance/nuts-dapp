import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, NgZone } from '@angular/core';
import { Subscription } from 'rxjs';

import { AccountService } from '../account.service';

@Component({
  selector: 'app-account-balance',
  templateUrl: './account-balance.component.html',
  styleUrls: ['./account-balance.component.scss']
})
export class AccountBalanceComponent implements OnInit, OnChanges, OnDestroy {
  @Input() public tokenAddress: string;
  @Input() public instrument: string;
  @Output() public balanceUpdated = new EventEmitter<string>();
  public tokenBalance: string;
  
  private accountBalancesSubscription: Subscription;

  constructor(private accountService: AccountService, private zone: NgZone) { }

  ngOnInit() {
    this.accountBalancesSubscription = this.accountService.accountsBalanceSubject.subscribe(_ => {
      this.zone.run(() => {
        this.tokenBalance = this.accountService.getAccountBalance(this.instrument, this.tokenAddress);
        this.balanceUpdated.next(this.tokenBalance);
      });
    });
  }

  ngOnDestroy() {
    this.accountBalancesSubscription.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.tokenBalance = this.accountService.getAccountBalance(this.instrument, this.tokenAddress);
    this.balanceUpdated.next(this.tokenBalance);
  }
}

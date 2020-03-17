import { Component, OnInit } from '@angular/core';
import { InstrumentService } from 'src/app/common/web3/instrument.service';
import { UserBalanceService } from 'src/app/common/web3/user-balance.service';

@Component({
  selector: 'app-lending',
  templateUrl: './lending.component.html',
  styleUrls: ['./lending.component.scss']
})
export class LendingComponent implements OnInit {

  constructor(private instrumentService: InstrumentService, private userBalanceService: UserBalanceService) { }

  ngOnInit() {
    this.instrumentService.reloadLendingIssuances();
    this.userBalanceService.getUserBalanceOnChain();
  }
}

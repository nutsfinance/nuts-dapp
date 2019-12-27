import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-wallet-withdraw',
  templateUrl: './wallet-withdraw.component.html',
  styleUrls: ['./wallet-withdraw.component.scss']
})
export class WalletWithdrawComponent implements OnInit {
  private selectedToken = 'ETH';

  constructor() {}

  ngOnInit() {
  }

}

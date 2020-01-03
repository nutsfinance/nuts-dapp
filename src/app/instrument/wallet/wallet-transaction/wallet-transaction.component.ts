import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-wallet-transaction',
  templateUrl: './wallet-transaction.component.html',
  styleUrls: ['./wallet-transaction.component.scss']
})
export class WalletTransactionComponent implements OnInit {
  @Input() private instrument: string;

  constructor() { }

  ngOnInit() {
  }

}

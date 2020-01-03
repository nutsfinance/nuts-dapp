import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-wallet-deposit',
  templateUrl: './wallet-deposit.component.html',
  styleUrls: ['./wallet-deposit.component.scss']
})
export class WalletDepositComponent implements OnInit {
  @Input() private instrument: string;
  private selectedToken = 'ETH';

  constructor() { }

  ngOnInit() {
  }

  onTokenSelected(token: string) {
    console.log(token);
    this.selectedToken = token;
  }
}

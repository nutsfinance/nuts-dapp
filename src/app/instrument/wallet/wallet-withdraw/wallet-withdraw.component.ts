import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-wallet-withdraw',
  templateUrl: './wallet-withdraw.component.html',
  styleUrls: ['./wallet-withdraw.component.scss']
})
export class WalletWithdrawComponent implements OnInit {
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

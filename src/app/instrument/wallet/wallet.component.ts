import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.scss']
})
export class WalletComponent implements OnInit {
  @Input() private instrument: string;

  constructor() { }

  ngOnInit() {
  }

}

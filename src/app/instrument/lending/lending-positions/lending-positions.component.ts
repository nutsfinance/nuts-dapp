import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-lending-positions',
  templateUrl: './lending-positions.component.html',
  styleUrls: ['./lending-positions.component.scss']
})
export class LendingPositionsComponent implements OnInit {
  private selectedTab = 'all';
  private columns: string[] = ['position', 'role', 'status', 'amount', 'expiry'];
  private lendingIssuances = [];

  constructor() { }

  ngOnInit() {
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
  }

}

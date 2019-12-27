import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-lending',
  templateUrl: './lending.component.html',
  styleUrls: ['./lending.component.scss']
})
export class LendingComponent implements OnInit {
  private selectedTab = 'wallet';

  constructor() { }

  ngOnInit() {
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
  }
}

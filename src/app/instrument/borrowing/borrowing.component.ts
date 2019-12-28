import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-borrowing',
  templateUrl: './borrowing.component.html',
  styleUrls: ['./borrowing.component.scss']
})
export class BorrowingComponent implements OnInit {
  private selectedTab = 'wallet';

  constructor() { }

  ngOnInit() {
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
  }

}

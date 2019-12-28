import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-saving',
  templateUrl: './saving.component.html',
  styleUrls: ['./saving.component.scss']
})
export class SavingComponent implements OnInit {
  private selectedTab = 'wallet';

  constructor() { }

  ngOnInit() {
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
  }
}

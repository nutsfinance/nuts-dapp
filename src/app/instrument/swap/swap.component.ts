import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-swap',
  templateUrl: './swap.component.html',
  styleUrls: ['./swap.component.scss']
})
export class SwapComponent implements OnInit {
  private selectedTab = 'wallet';

  constructor() { }

  ngOnInit() {
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
  }
}

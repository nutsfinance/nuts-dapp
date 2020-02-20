import { Component, OnInit } from '@angular/core';
import { ChartType } from 'chart.js';
import { MultiDataSet, Label } from 'ng2-charts';

@Component({
  selector: 'app-dashboard-account-balance',
  templateUrl: './dashboard-account-balance.component.html',
  styleUrls: ['./dashboard-account-balance.component.scss']
})
export class DashboardAccountBalanceComponent implements OnInit {
  // Doughnut
  public doughnutChartLabels: Label[] = ['Saving', 'Lending', 'Borrowing', 'Swap'];
  public doughnutChartData: MultiDataSet = [
    [200, 350, 450, 100],
  ];
  public doughnutChartType: ChartType = 'doughnut';

  public options = {
        title: {
            display: true,
            text: 'Instrument Balance'
        },
        legend: {
          position: 'bottom',
        },
        aspectRatio: 1.2
  };

  constructor() { }

  ngOnInit() {
  }

}

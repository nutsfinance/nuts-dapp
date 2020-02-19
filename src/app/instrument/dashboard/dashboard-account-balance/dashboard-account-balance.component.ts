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
  public doughnutChartLabels: Label[] = ['Download Sales', 'In-Store Sales', 'Mail-Order Sales'];
  public doughnutChartData: MultiDataSet = [
    [350, 450, 100],
  ];
  public doughnutChartType: ChartType = 'doughnut';

  public options = {
        title: {
            display: true,
            text: 'Custom Chart Title'
        },
        legend: {
          position: 'bottom'
        },
        aspectRatio: 1.2
  };

  constructor() { }

  ngOnInit() {
  }

}

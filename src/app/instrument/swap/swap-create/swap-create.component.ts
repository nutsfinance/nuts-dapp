import { Component, OnInit } from '@angular/core';
import { MatButtonToggleChange } from '@angular/material';

@Component({
  selector: 'app-swap-create',
  templateUrl: './swap-create.component.html',
  styleUrls: ['./swap-create.component.scss']
})
export class SwapCreateComponent implements OnInit {
  private inputToken = 'ETH';
  private outputToken = 'ETH';
  private inputAmount: number;
  private outputAmount: number;
  private tenor: number;

  constructor() { }

  ngOnInit() {
  }

  onInputTokenSelected(token: string) {
    this.inputToken = token;
  }

  onOutputTokenSelected(token: string) {
    this.outputToken = token;
  }

  onTenorChange(tenorChange: MatButtonToggleChange) {
    console.log(tenorChange.value);
    this.tenor = tenorChange.value;
  }
}

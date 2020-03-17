import { Component, OnInit } from '@angular/core';
import { MatButtonToggleChange } from '@angular/material';

@Component({
  selector: 'app-swap-create',
  templateUrl: './swap-create.component.html',
  styleUrls: ['./swap-create.component.scss']
})
export class SwapCreateComponent implements OnInit {
  public inputToken = 'ETH';
  public outputToken = 'ETH';
  public inputAmount: number;
  public outputAmount: number;
  public tenor: number;
  public showAlternativeTenor = false;

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

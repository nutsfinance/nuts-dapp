import { Injectable } from '@angular/core';
import { NutsPlatformService } from './nuts-platform.service';

const PriceOracle = require('./abi/PriceOracleInterface.json');

@Injectable({
  providedIn: 'root'
})
export class PriceOracleService {
  // Cached prices: <source-target>: [numerator, denominator]
  private prices = {};

  constructor(private nutsPlatformService: NutsPlatformService) { }

  async getPrice(baseTokenAddress: string, quoteTokenAddress: string, refresh?: boolean) {
    const priceKey = `${baseTokenAddress}-${quoteTokenAddress}`;
    if (this.prices[priceKey] && !refresh) {
      return Promise.resolve(this.prices[priceKey]);
    }

  }
}

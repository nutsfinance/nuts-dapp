import { Injectable } from '@angular/core';
import { NutsPlatformService } from './nuts-platform.service';

@Injectable({
  providedIn: 'root'
})
export class PriceOracleService {
  // Cached prices: <source-target>: [numerator, denominator]
  private prices = {};

  USD_ADDRESS = '0x3EfC5E3c4CFFc638E9C506bb0F040EA0d8d3D094';

  constructor(private nutsPlatformService: NutsPlatformService) { }

  async getPrice(baseTokenAddress: string, quoteTokenAddress: string, refresh?: boolean) {
    if (baseTokenAddress === quoteTokenAddress) return Promise.resolve([1, 1]);
    const priceKey = `${baseTokenAddress}-${quoteTokenAddress}`;
    if (this.prices[priceKey] && !refresh) {
      return Promise.resolve(this.prices[priceKey]);
    }
    const priceOracleContract = this.nutsPlatformService.getPriceOracleContract();
    const result = await priceOracleContract.methods.getRate(baseTokenAddress, quoteTokenAddress).call({from: this.nutsPlatformService.currentAccount});
    this.prices[priceKey] = result;

    return result;
  }

  async getConvertedValue(baseTokenAddress: string, quoteTokenAddress: string, numerator: number, denominator = 1) {
    const result = await this.getPrice(baseTokenAddress, quoteTokenAddress);
    return numerator * result[1] / (result[0] * denominator);
  }
}

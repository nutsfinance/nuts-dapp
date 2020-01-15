import { Injectable } from '@angular/core';
import { NutsPlatformService } from './nuts-platform.service';

const PriceOracle = require('./abi/PriceOracleInterface.json');

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

    if (!this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork]) {
      alert(`Network ${this.nutsPlatformService.currentNetwork} is not supported!`);
    }
    if (!this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform.priceOracle) {
      alert(`Price Oracle is not supported!`);
    }
    const priceOracleAddress = this.nutsPlatformService.contractAddresses[this.nutsPlatformService.currentNetwork].platform.priceOracle;
    const priceOracleContract = new this.nutsPlatformService.web3.eth.Contract(PriceOracle, priceOracleAddress);
    const result = await priceOracleContract.methods.getRate(baseTokenAddress, quoteTokenAddress).call({from: this.nutsPlatformService.currentAccount});
    this.prices[priceKey] = result;

    return result;
  }
}

import { Injectable } from '@angular/core';
import { NutsPlatformService } from './nuts-platform.service';
import { HttpClient } from '@angular/common/http';

export interface Price {
  priceId: string,
  input: string,
  output: string,
  rate: number,
}

@Injectable({
  providedIn: 'root'
})
export class PriceOracleService {
  // Cached prices: <source-target>: rate
  private prices = {};

  constructor(private nutsPlatformService: NutsPlatformService, private http: HttpClient) { }

  async getConvertedValue(inputTokenName: string, outputTokenName: string, inputValue: number, refresh = false): Promise<number> {
    if (inputTokenName === outputTokenName) return inputValue;

    // If the price is cached and there is no need to get the latest price, simply return it!
    const priceKey = `${inputTokenName}-${outputTokenName}`;
    if (this.prices[priceKey] && !refresh) {
      return this.prices[priceKey] * inputValue;
    }

    const price = await this.http.get<Price>(`${this.nutsPlatformService.getApiServerHost()}/prices`, {
      params: {
        inputToken: inputTokenName, outputToken: outputTokenName
      }
    }).toPromise();
    this.prices[priceKey] = price.rate;
    return price.rate * inputValue;
  }
}

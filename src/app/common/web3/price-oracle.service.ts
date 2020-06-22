import { Injectable } from '@angular/core';
import { NutsPlatformService } from './nuts-platform.service';
import { HttpClient } from '@angular/common/http';
import { CurrencyService } from '../currency-select/currency.service';
import { TokenModel } from '../token/token.model';
import { TokenService } from '../token/token.service';

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

  constructor(private nutsPlatformService: NutsPlatformService, private currencyService: CurrencyService,
    private tokenService: TokenService, private http: HttpClient) { }

  async getConvertedCurrencyValue(inputToken: TokenModel, inputValue: string, refresh = false) {
    const currency = this.currencyService.currency;
    const inputDisplayValue = this.tokenService.getDisplayValue(inputToken.tokenAddress, inputValue);
    const priceKey = `${inputToken.tokenSymbol}-${currency}`;
    if (this.prices[priceKey] && !refresh) {
      return this.prices[priceKey] * inputDisplayValue;
    }

    const price = await this.getPrice(inputToken.tokenSymbol, currency);
    this.prices[priceKey] = price.rate;
    return price.rate * inputDisplayValue;
  }

  async getConvertedDisplayValue(inputToken: TokenModel, outputToken: TokenModel, inputValue: string, refresh = false): Promise<number> {
    const inputDisplayValue = this.tokenService.getDisplayValue(inputToken.tokenAddress, inputValue);
    if (inputToken.tokenSymbol === outputToken.tokenSymbol) return inputDisplayValue;

    // If the price is cached and there is no need to get the latest price, simply return it!
    const priceKey = `${inputToken.tokenSymbol}-${outputToken.tokenSymbol}`;
    if (this.prices[priceKey] && !refresh) {
      return this.prices[priceKey] * inputDisplayValue;
    }

    const price = await this.getPrice(inputToken.tokenSymbol, outputToken.tokenSymbol);
    this.prices[priceKey] = price.rate;
    return price.rate * inputDisplayValue;
  }

  async getConvertedActualValue(inputToken: TokenModel, outputToken: TokenModel, inputValue: string, refresh = false): Promise<string> {
    
    if (inputToken.tokenSymbol === outputToken.tokenSymbol) return inputValue;

    const inputDisplayValue = this.tokenService.getDisplayValue(inputToken.tokenAddress, inputValue);
    // If the price is cached and there is no need to get the latest price, simply return it!
    const priceKey = `${inputToken.tokenSymbol}-${outputToken.tokenSymbol}`;
    if (this.prices[priceKey] && !refresh) {
      return this.tokenService.getActualValue(outputToken.tokenAddress, this.prices[priceKey] * inputDisplayValue + '');
    }

    const price = await this.getPrice(inputToken.tokenSymbol, outputToken.tokenSymbol);
    this.prices[priceKey] = price.rate;
    return this.tokenService.getActualValue(outputToken.tokenAddress, price.rate * inputDisplayValue + '');
  }

  private getPrice(inputTokenName: string, outputTokenName: string): Promise<Price> {
    return this.http.get<Price>(`${this.nutsPlatformService.getApiServerHost()}/prices`, {
      params: {
        inputToken: inputTokenName, outputToken: outputTokenName
      }
    }).toPromise();
  }
}

import { Injectable } from '@angular/core';
import { NutsPlatformService } from './nuts-platform.service';
import { HttpClient } from '@angular/common/http';
import { CurrencyService } from '../currency-select/currency.service';
import { TokenModel } from '../token/token.model';
import { TokenService } from '../token/token.service';

export interface Price {
  rate?: number,
  numerator?: string,
  denominator?: string,
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

    const price = await this.getPriceFromBackend(inputToken.tokenSymbol, currency);
    this.prices[priceKey] = price.rate;
    return price.rate * inputDisplayValue;
  }

  async getConvertedDisplayValue(inputToken: TokenModel, outputToken: TokenModel, inputValue: string, refresh = false): Promise<number> {
    const convertedActualValue = await this.getConvertedActualValue(inputToken, outputToken, inputValue, refresh);

    return this.tokenService.getDisplayValue(outputToken.tokenAddress, convertedActualValue);
  }

  async getConvertedActualValue(inputToken: TokenModel, outputToken: TokenModel, inputValue: string, refresh = false): Promise<string> {
    
    if (inputToken.tokenSymbol === outputToken.tokenSymbol) return inputValue;

    const priceKey = `${inputToken.tokenSymbol}-${outputToken.tokenSymbol}`;
    const BN = this.nutsPlatformService.web3.utils.BN;
    if (!this.prices[priceKey] || refresh) {
      const chainPrice = await this.getPriceFromChain(inputToken, outputToken);
      console.log(inputToken.tokenSymbol, outputToken.tokenSymbol, chainPrice);
      this.prices[priceKey] = chainPrice;
    }
    
    return new BN(inputValue).mul(new BN(this.prices[priceKey].denominator)).div(new BN(this.prices[priceKey].numerator)).toString();
  }

  private getPriceFromBackend(inputTokenName: string, outputTokenName: string): Promise<Price> {
    return this.http.get<Price>(`${this.nutsPlatformService.getApiServerHost()}/prices`, {
      params: {
        inputToken: inputTokenName, outputToken: outputTokenName
      }
    }).toPromise();
  }

  private async getPriceFromChain(inputToken: TokenModel, outputToken: TokenModel): Promise<{numerator: string, denominator: string}> {
    const priceOracle = this.nutsPlatformService.getPriceOracleContract();
    return priceOracle.methods.getRate(inputToken.tokenAddress, outputToken.tokenAddress).call();
  }
}

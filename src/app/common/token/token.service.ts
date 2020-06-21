import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NutsPlatformService } from '../web3/nuts-platform.service';
import { TokenModel } from './token.model';
import { Observable, Subject, BehaviorSubject, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import BigNumber from 'bignumber.js';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  public tokens: TokenModel[] = [];
  // Token symbol -> Token
  public tokenSymbols: { [key: string]: TokenModel } = {};
  // Token address -> Token
  public tokenAddresses: { [key: string]: TokenModel } = {};
  public tokensUpdatedSubject: Subject<TokenModel[]> = new Subject();

  constructor(private nutsPlatformService: NutsPlatformService, private http: HttpClient) {
    this.nutsPlatformService.currentNetworkSubject.subscribe(_ => {
      this.refreshTokens();
    });
  }

  public getTokens(): Observable<TokenModel[]> {
    if (this.tokens.length !== 0) return of(this.tokens);
    return this.http.get<TokenModel[]>(`${this.nutsPlatformService.getApiServerHost()}/tokens`)
      .pipe(tap(tokens => this.updateTokens(tokens)));
  }

  public refreshTokens() {
    this.getTokens().subscribe(tokens => {
      this.updateTokens(tokens);
    });
  }

  private updateTokens(tokens) {
    this.tokens = tokens;
    this.tokenSymbols = {};
    this.tokenAddresses = {};
    for (let token of tokens) {
      this.tokenSymbols[token.tokenSymbol] = token;
      this.tokenAddresses[token.tokenAddress.toLowerCase()] = token;
    }
    this.tokensUpdatedSubject.next(tokens);
  }

  public getTokenIconUrl(token: TokenModel) {
    if (token) return token.iconUrl;
    console.log(token.tokenSymbol.toLowerCase());

    switch (token.tokenSymbol.toLowerCase()) {
      case 'usdt':
        return 'assets/tokens/usdt.svg';
      case 'usdc':
        return 'assets/tokens/usdc.svg';
      case 'dai':
        return 'assets/tokens/dai.svg';
      default:
        return 'assets/tokens/eth.svg';
    }
  }

  public getTokenByAddress(tokenAddress: string): TokenModel {
    if (!tokenAddress) return null;
    return this.tokenAddresses[tokenAddress.toLowerCase()];
  }

  /**
   * Converts the Ethereum value of a token to a human-readable value.
   * @param tokenAddress 
   * @param actualValue 
   */
  public getDisplayValue(tokenAddress: string, actualValue: string): number {
    if (!actualValue) return 0;

    const value = new BigNumber(actualValue);
    const rate = new BigNumber(10).exponentiatedBy(this.tokenAddresses[tokenAddress].decimals);

    return value.div(rate).toNumber();
  }

  /**
   * Converts a human-readable value of a token to the Ethereum value.
   * @param tokenAddress 
   * @param displayValue 
   */
  public getActualValue(tokenAddress: string, displayValue: string): string {
    if (!displayValue) return '';

    const value = new BigNumber(displayValue);
    const rate = new BigNumber(10).exponentiatedBy(this.tokenAddresses[tokenAddress].decimals);

    return value.multipliedBy(rate).toFixed();
  }

  public async getWalletBalance(tokenAddress: string): Promise<number> {
    if (!tokenAddress) return 0;
    const currentAccount = this.nutsPlatformService.currentAccount;
    if (tokenAddress === this.nutsPlatformService.getWETH()) {
      return await this.nutsPlatformService.web3.eth.getBalance(currentAccount);
    } else {
      if (!tokenAddress) return 0;
      return this.nutsPlatformService.getERC20TokenContract(tokenAddress).methods.balanceOf(currentAccount).call();
    }
  }

  public async getWalletAllowance(instrument: string, tokenAddress: string): Promise<number> {
    if (!tokenAddress) return 0;
    const tokenContract = this.nutsPlatformService.getERC20TokenContract(tokenAddress);
    const instrumentEscrowAddress = this.nutsPlatformService.getInstrumentEscrowAddress(instrument);
    const allowance = await tokenContract.methods.allowance(this.nutsPlatformService.currentAccount, instrumentEscrowAddress).call();
    return Number(allowance);
  }
}

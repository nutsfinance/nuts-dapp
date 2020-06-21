import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { USD_ADDRESS, CNY_ADDRESS } from '../web3/nuts-platform.service';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  public currency = 'USD';
  public currencyUpdatedSubject = new Subject<string>();

  constructor() { }

  setCurrency(currency: string) {
    if (this.currency !== currency) {
      this.currency = currency;
      this.currencyUpdatedSubject.next(currency);
    }
  }

  getCurrencySymbol(): string {
    return this.currency === 'USD' ? '$' : '¥';
  }

  getCurrencyAddress(): string {
    return this.currency === 'USD' ? USD_ADDRESS : CNY_ADDRESS;
  }
}

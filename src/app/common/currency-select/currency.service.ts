import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

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
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { NutsPlatformService } from '../common/web3/nuts-platform.service';
import { TransactionModel } from './transaction.model';



@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  notificationServer: string = environment.notificationServer;

  constructor(private nutsPlatformService: NutsPlatformService, private http: HttpClient) { }

  addTransaction(transaction: TransactionModel) {
    console.log(this.notificationServer);
    console.log(`${this.notificationServer}/transactions`);
    return this.http.post(`${this.notificationServer}/transactions`, transaction);
  }
}

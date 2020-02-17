import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';

import { environment } from '../../environments/environment';
import { NutsPlatformService } from '../common/web3/nuts-platform.service';
import { TransactionModel } from './transaction.model';
import { NotificationModel } from './notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  public notifications: NotificationModel[] = [];
  public notificationUpdatedSubject: Subject<NotificationModel[]> = new BehaviorSubject<NotificationModel[]>([]);

  constructor(private nutsPlatformService: NutsPlatformService, private http: HttpClient) {
    this.nutsPlatformService.currentAccountSubject.subscribe(currentAddress => {
      if (currentAddress) {
        this.getNotifications(currentAddress);
      }
    });
  }

  getNotifications(userAddress: string) {
    this.http.get<NotificationModel[]>(`${environment.notificationServer}/notifications/${userAddress}`).subscribe(notifications => {
      console.log(notifications);
      this.notifications = notifications;
      this.notificationUpdatedSubject.next(notifications);
    });
  }

  addTransaction(transaction: TransactionModel) {
    console.log(`${environment.notificationServer}/transactions`);
    return this.http.post(`${environment.notificationServer}/transactions`, transaction);
  }
}

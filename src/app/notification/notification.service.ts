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
        this.getNotifications().subscribe(notifications => {
          this.notifications = notifications;
          this.notificationUpdatedSubject.next(notifications);
        });
      }
    });
  }

  getNotifications() {
    const currentAddress = this.nutsPlatformService.currentAccount;
    return this.http.get<NotificationModel[]>(`${environment.notificationServer}/notifications/${currentAddress}`);
  }

  addTransaction(transaction: TransactionModel) {
    console.log(`${environment.notificationServer}/transactions`);
    return this.http.post(`${environment.notificationServer}/transactions`, transaction);
  }

  updateNotification(notification: NotificationModel) {
    this.http.put<NotificationModel>(`${environment.notificationServer}/notifications/${notification.notificationId}`, notification).subscribe(updatedNotification => {
      for (let i = 0; i < this.notifications.length; i++) {
        if (this.notifications[i].notificationId === updatedNotification.notificationId) {
          this.notifications[i] = updatedNotification;
          break;
        }
      }

      this.notificationUpdatedSubject.next(this.notifications);
    });
  }

  updateNotifications(notifications: NotificationModel[]) {
    this.http.put<NotificationModel[]>(`${environment.notificationServer}/notifications`, notifications).subscribe(updatedNotifications => {
      for (let notification of notifications) {
        for (let i = 0; i < this.notifications.length; i++) {
          if (this.notifications[i].notificationId === notification.notificationId) {
            this.notifications[i] = notification;
            break;
          }
        }
      }

      this.notificationUpdatedSubject.next(this.notifications);
    });
  }
}

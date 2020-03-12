import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject, Observable, of } from 'rxjs';

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
        console.log('Address updated', currentAddress);
        this.getNotifications().subscribe(notifications => {
          console.log('Notifications updated', notifications);
          const sortedNotifications = notifications.sort((n1, n2) => n2.creationTimestamp - n1.creationTimestamp);
          this.notifications = sortedNotifications;
          this.notificationUpdatedSubject.next(sortedNotifications);
        });
      }
    });
  }

  getNotifications() {
    const currentAddress = this.nutsPlatformService.currentAccount;
    const currentNetwork = this.nutsPlatformService.currentNetwork;
    if (!currentAddress || (currentNetwork !== 1 && currentNetwork !== 4)) {
      console.log(currentAddress, currentNetwork);
      return of([]);
    }
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

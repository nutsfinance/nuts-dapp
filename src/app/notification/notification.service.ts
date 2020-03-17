import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject, of } from 'rxjs';

import { environment } from '../../environments/environment';
import { NutsPlatformService } from '../common/web3/nuts-platform.service';
import { TransactionModel } from './transaction.model';
import { NotificationModel, NotificationStatus } from './notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  public notifications: NotificationModel[] = [];
  public notificationUpdatedSubject: Subject<NotificationModel[]> = new BehaviorSubject<NotificationModel[]>([]);
  public newNotificationSubject: Subject<NotificationModel> = new Subject<NotificationModel>();

  constructor(private nutsPlatformService: NutsPlatformService, private http: HttpClient) {
    this.nutsPlatformService.platformInitializedSubject.subscribe(initialized => {
      if (initialized) {
        this.getAllNotifications();

        // Reload notifications when the network changes
        this.nutsPlatformService.currentNetworkSubject.subscribe(currentNetwork => {
          this.getAllNotifications();
        });

        // Reload notifications when the account changes
        this.nutsPlatformService.currentAccountSubject.subscribe(currentAddress => {
          this.getAllNotifications();
        });

        // Reload notifications each time a new transaction is sent to receive the TRANSACTION INITIATED notification
        this.nutsPlatformService.transactionSentSubject.subscribe(_ => {
          console.log('Transaction sent. Reloading notifications....');
          this.getAllNotifications();
        });

        // Incrementally read new notification each time a new receipt is received
        this.nutsPlatformService.transactionConfirmedSubject.subscribe(_ => {
          console.log('Receipt received. Reloading notifications....');
          setTimeout(this.incrementalGetNotification.bind(this), 1000);
        });

        // Incrementally read new notification every 20s
        setInterval(this.incrementalGetNotification.bind(this), 20000);
      }
    });
  }

  getAllNotifications() {
    this.getNotificationFromBackend().subscribe(notifications => {
      console.log('Notifications updated', notifications);
      const sortedNotifications = notifications.sort((n1, n2) => n2.creationTimestamp - n1.creationTimestamp);
      this.notifications = sortedNotifications;
      this.notificationUpdatedSubject.next(sortedNotifications);
    });
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

  /**
   * Get notifications from the backend
   */
  private getNotificationFromBackend() {
    const currentAddress = this.nutsPlatformService.currentAccount;
    const currentNetwork = this.nutsPlatformService.currentNetwork;
    if (!this.nutsPlatformService.isFullyLoaded()) {
      console.log('Current address', currentAddress, 'Current network', currentNetwork);
      return of([]);
    }
    return this.http.get<NotificationModel[]>(`${environment.notificationServer}/notifications/${currentAddress}`);
  }

  /**
   * Incrementally get new notifications.
   * One major difference between getAllNotifications() and incrementalGetNotification() is
   * getAllNotification() reads all notifications and does not trigger NewNotificationSubject,
   * but incrementalGetNotification() does.
   */
  private incrementalGetNotification() {
    this.getNotificationFromBackend().subscribe(notifications => {
      const reloadedNotifications = notifications.sort((n1, n2) => n2.creationTimestamp - n1.creationTimestamp);

      // Checks whether the notification list is updated.
      // If notifications length is not the same, it must be updated.
      let updated = reloadedNotifications.length !== this.notifications.length;
      if (!updated) {
        for (let i = 0; i < reloadedNotifications.length; i++) {
          if (reloadedNotifications[i].notificationId !== this.notifications[i].notificationId) {
            console.log('Mismatch', i, reloadedNotifications[i].notificationId, this.notifications[i].notificationId);
            updated = true;
            break;
          }
        }
      }

      if (!updated) {
        console.log('Notifications not updated.');
        return;
      }

      console.log('Current notifications', this.notifications);
      console.log('Reloaded notifications', reloadedNotifications);

      // Check whether are any new unread notifications.
      for (let i = 0; i < reloadedNotifications.length; i++) {
        if (reloadedNotifications[i].status === NotificationStatus.NEW) {
          console.log('New notification', reloadedNotifications[i]);
          this.newNotificationSubject.next(reloadedNotifications[i]);
          break;
        }
      }

      // Updates the notification list
      this.notifications = reloadedNotifications;
      this.notificationUpdatedSubject.next(reloadedNotifications);
    });
  }
}

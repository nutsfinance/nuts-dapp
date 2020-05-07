import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject, of } from 'rxjs';
import * as isEqual from 'lodash.isequal';

import { NutsPlatformService } from '../common/web3/nuts-platform.service';
import { TransactionModel } from './transaction.model';
import { NotificationModel, NotificationReadStatus } from './notification.model';

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
        // Need to reload notifications each time there is a change to the network or account
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
          this.incrementalGetNotification();
        });

        // Incrementally read new notification each time a new receipt is received
        this.nutsPlatformService.transactionConfirmedSubject.subscribe(_ => {
          setTimeout(this.incrementalGetNotification.bind(this), 1000);
        });

        // Incrementally read new notification every 20s
        setInterval(this.incrementalGetNotification.bind(this), 20000);
      }
    });
  }

  addTransaction(transaction: TransactionModel) {
    return this.http.post(`${this.nutsPlatformService.getApiServerHost()}/transactions`, transaction);
  }

  getAllNotifications() {
    if (!this.nutsPlatformService.isFullyLoaded()) {
      console.log('Either network or account is not loaded.');
      return;
    }
    this.getNotificationFromBackend().subscribe(notifications => {
      console.log('Notifications updated', notifications.length);
      const sortedNotifications = notifications.sort((n1, n2) => n2.creationTimestamp - n1.creationTimestamp);
      this.notifications = sortedNotifications;
      this.notificationUpdatedSubject.next(sortedNotifications);
    });
  }

  updateNotification(notification: NotificationModel) {
    this.http.put<NotificationModel>(`${this.nutsPlatformService.getApiServerHost()}/notifications/${notification.notificationId}`, notification).subscribe(updatedNotification => {
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
    this.http.put<NotificationModel[]>(`${this.nutsPlatformService.getApiServerHost()}/notifications`, notifications).subscribe(updatedNotifications => {
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
      console.log('Notification not initialized: Current address', currentAddress, 'Current network', currentNetwork);
      return of([]);
    }
    return this.http.get<NotificationModel[]>(`${this.nutsPlatformService.getApiServerHost()}/notifications/${currentAddress}`);
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
      console.log('Reloaded notifications', reloadedNotifications.length);

      // Checks whether the notification list is updated.
      // If notifications length is not the same, it must be updated.
      let updated = reloadedNotifications.length !== this.notifications.length;
      if (!updated) {
        for (let i = 0; i < reloadedNotifications.length; i++) {
          if (reloadedNotifications[i].notificationId !== this.notifications[i].notificationId) {
            updated = true;
            break;
          }
        }
      }

      if (!updated) {
        return;
      }

      // Check whether are any new unread notifications.
      for (let i = 0; i < reloadedNotifications.length; i++) {
        if (reloadedNotifications[i].readStatus === NotificationReadStatus.NEW) {
          console.log('New notification', reloadedNotifications[i]);
          this.newNotificationSubject.next(reloadedNotifications[i]);
          break;
        }
      }

      // Updates the notification list if there is a change
      if (!isEqual(this.notifications, reloadedNotifications)) {
        console.log('Notification list updated.');
        this.notifications = reloadedNotifications;
        this.notificationUpdatedSubject.next(reloadedNotifications);
      }
    });
  }
}

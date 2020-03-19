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

  private apiServerHost = '';

  constructor(private nutsPlatformService: NutsPlatformService, private http: HttpClient) {
    this.nutsPlatformService.platformInitializedSubject.subscribe(initialized => {
      if (initialized) {
        console.log('Notification initialized', initialized);
        // Updates the API server first
        this.updateApiServerHost(this.nutsPlatformService.currentNetwork);
        this.getAllNotifications();

        // Reload notifications when the network changes
        this.nutsPlatformService.currentNetworkSubject.subscribe(currentNetwork => {
          // Updates the API server first
          this.updateApiServerHost(currentNetwork);
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
    console.log('Get all notifications');
    if (!this.nutsPlatformService.isFullyLoaded()) {
      console.log('Either network or account is not loaded.');
      return;
    }
    this.getNotificationFromBackend().subscribe(notifications => {
      console.log('Notifications updated', notifications);
      const sortedNotifications = notifications.sort((n1, n2) => n2.creationTimestamp - n1.creationTimestamp);
      this.notifications = sortedNotifications;
      this.notificationUpdatedSubject.next(sortedNotifications);
    });
  }

  addTransaction(transaction: TransactionModel) {
    console.log(`${this.apiServerHost}/transactions`);
    return this.http.post(`${this.apiServerHost}/transactions`, transaction);
  }

  updateNotification(notification: NotificationModel) {
    this.http.put<NotificationModel>(`${this.apiServerHost}/notifications/${notification.notificationId}`, notification).subscribe(updatedNotification => {
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
    this.http.put<NotificationModel[]>(`${this.apiServerHost}/notifications`, notifications).subscribe(updatedNotifications => {
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
   * Updates the API server host name.
   * @param currentNetwork 
   */
  private updateApiServerHost(currentNetwork) {
    switch(currentNetwork) {
      case 1:
        this.apiServerHost = 'https://main-api.dapp.finance';
        break;
      case 4:
        this.apiServerHost = 'https://rinkeby-api.dapp.finance';
        break;
      case 42:
        this.apiServerHost = 'https://kovan-api.dapp.finance';
        break;
      default:
        this.apiServerHost = '';
        break;
    }
    console.log('Network updated', currentNetwork, "New API server host", this.apiServerHost);
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
    return this.http.get<NotificationModel[]>(`${this.apiServerHost}/notifications/${currentAddress}`);
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

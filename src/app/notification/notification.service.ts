import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject, of } from 'rxjs';
import * as isEqual from 'lodash.isequal';

import { environment } from '../../environments/environment';
import { IPO_SUBSCRIPTION_NAME, NutsPlatformService } from '../common/web3/nuts-platform.service';
import { TransactionModel, TransactionType } from './transaction.model';
import { NotificationModel, NotificationReadStatus, NotificationCategory } from './notification.model';
import { GlobalNotificationModel } from './global-notification.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  public notifications: NotificationModel[] = [];
  public globalNotifications: GlobalNotificationModel[] = [];
  public notificationUpdatedSubject: Subject<NotificationModel[]> = new BehaviorSubject<NotificationModel[]>([]);
  public newNotificationSubject: Subject<NotificationModel> = new Subject<NotificationModel>();
  public globalNotificationUpdatedSubject: Subject<GlobalNotificationModel[]> = new BehaviorSubject([]);

  constructor(private nutsPlatformService: NutsPlatformService, private http: HttpClient, private router: Router) {
    this.nutsPlatformService.platformInitializedSubject.subscribe(initialized => {
      if (initialized) {
        // Need to reload notifications each time there is a change to the network or account
        this.getAllNotifications();
        // Reload notifications when the network changes
        this.nutsPlatformService.currentNetworkSubject.subscribe(currentNetwork => {
          this.getAllNotifications();
          this.getGlobalNotification();
        });
        // Reload notifications when the account changes
        this.nutsPlatformService.currentAccountSubject.subscribe(currentAddress => {
          this.getAllNotifications();
          this.getGlobalNotification();
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

        // Need to reload global notifications each time there is a change to the network or account
        this.getGlobalNotification();
        // Global notifications are not frequent so that it's reloaded every 60s
        setInterval(this.getGlobalNotification.bind(this), 60000);
      }
    });
  }

  addTransaction(instrument: string, transaction: TransactionModel) {
    const instrumentId = this.nutsPlatformService.getInstrumentId(instrument);
    return this.http.post(`${this.nutsPlatformService.getApiServerHost()}/instruments/${instrumentId}/transactions`, transaction);
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
    this.http.put<NotificationModel>(`${this.nutsPlatformService.getApiServerHost()}/instruments/${notification.instrumentId}/notifications/${notification.notificationId}`, notification).subscribe(updatedNotification => {
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
    this.http.put<NotificationModel[]>(`${this.nutsPlatformService.getApiServerHost()}/instruments/${notifications[0].instrumentId}/notifications`, notifications).subscribe(updatedNotifications => {
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
    const instrumentId = this.nutsPlatformService.getInstrumentId(IPO_SUBSCRIPTION_NAME);
    return this.http.get<NotificationModel[]>(`${this.nutsPlatformService.getApiServerHost()}/instruments/${instrumentId}/notifications/${currentAddress}`, {
      params: {
        language: environment.languageCode
      }
    });
  }

  /**
   * Get global notifications
   */
  getGlobalNotification() {
    const currentAddress = this.nutsPlatformService.currentAccount;
    const currentNetwork = this.nutsPlatformService.currentNetwork;
    if (!this.nutsPlatformService.isFullyLoaded()) {
      console.log('Notification not initialized: Current address', currentAddress, 'Current network', currentNetwork);
      return of([]);
    }
    const instrumentId = this.nutsPlatformService.getInstrumentId(IPO_SUBSCRIPTION_NAME);
    this.http.get<GlobalNotificationModel[]>(`${this.nutsPlatformService.getApiServerHost()}/instruments/${instrumentId}/global-notifications/${currentAddress}`, {
      params: {
        language: environment.languageCode
      }
    }).subscribe(globalNotifications => {
      if (isEqual(globalNotifications, this.globalNotifications)) return;
      this.globalNotifications = globalNotifications;
      this.globalNotificationUpdatedSubject.next(globalNotifications);
    });
  }

  updateGlobalNotification(globalNotification: GlobalNotificationModel) {
    const currentAddress = this.nutsPlatformService.currentAccount;
    this.http.put(`${this.nutsPlatformService.getApiServerHost()}/instruments/${globalNotification.instrumentId}/global-notifications/${currentAddress}/${globalNotification.notificationId}`, globalNotification)
      .subscribe(_ => this.getGlobalNotification());
  }

  /**
   * Handler for notification action.
   * @param notification 
   */
  handleNotificationAction(notification: NotificationModel) {
    // Mark notification as READ
    notification.readStatus = NotificationReadStatus.READ;
    this.updateNotification(notification);
    const instrumentName = this.nutsPlatformService.getInstrumentById(+notification.instrumentId);
    const language = environment.language;

    // Note:
    // 1. Transaction initiated has no action
    // 2. Transaction failed should retry
    // 3. Transaction confirmed should redirect based on transaction type
    // 4. Expiration should redirect to my positions page
    switch (notification.category) {
      // Transaction failed should retry
      case NotificationCategory.TRANSACTION_FAILED:
        this.nutsPlatformService.retryTransaction(notification.transactionHash);
        break;
      // Expiration should redirect to my positions
      case NotificationCategory.EXPIRATION:
        this.router.navigate([`/${language}/instrument/${instrumentName}/positions`],
          { fragment: `ipo-${notification.metadata['ipoSubscriptionId']}` });
        break;
      // Transaction confirmed should redirect based on transaction type
      case NotificationCategory.TRANSACTION_CONFIRMED:
        this.handleTransactionConfirmedNotification(notification);
        break;
      // Ignore all other notification category
      default:
        break;
    }
  }

  private handleTransactionConfirmedNotification(notification: NotificationModel) {
    const language = environment.language;
    const instrumentName = this.nutsPlatformService.getInstrumentById(+notification.instrumentId);
    switch (notification.type) {
      case TransactionType.APPROVE:
        this.router.navigate([`/${language}/instrument/${instrumentName}/account`], {
          queryParams: {
            panel: 'deposit',
            tokenAddress: notification.metadata['tokenAddress'],
          }
        });
        break;
      case TransactionType.DEPOSIT:
      case TransactionType.WITHDRAW:
        this.router.navigate([`/${language}/instrument/${instrumentName}/account`],
          { queryParams: { panel: 'transactions' } });
        break;
      case TransactionType.ACCEPT_OFFER:
        this.router.navigate([`/${language}/instrument/${instrumentName}/positions`],
          { fragment: `ipo-${notification.metadata['ipoSubscriptionId']}` });
        break;
    }
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
      if (isEqual(reloadedNotifications, this.notifications)) {
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

      console.log('Notification list updated.');
      this.notifications = reloadedNotifications;
      this.notificationUpdatedSubject.next(reloadedNotifications);
    });
  }
}

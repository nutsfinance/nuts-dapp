import { Component, OnInit, OnDestroy, Inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar, MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

import { NotificationCategory, NotificationModel, NotificationStatus } from './notification/notification.model';
import { NotificationService } from './notification/notification.service';
import { Subscription } from 'rxjs';
import { NutsPlatformService } from './common/web3/nuts-platform.service';

export interface NotificationData {
  category: NotificationCategory,
  content: string,
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  private notificationHandler;
  private transactionSentSubscription: Subscription;
  private transactionConfirmedSubscription: Subscription;

  constructor(private notificationService: NotificationService, private nutsPlatformService: NutsPlatformService,
    private snackBar: MatSnackBar, private zone: NgZone) { }

  ngOnInit() {
    this.transactionConfirmedSubscription = this.nutsPlatformService.transactionSentSubject.subscribe(_ => {
      console.log('Transaction sent. Reloading notifications....');
      this.reloadNotifications();
    });
    this.transactionConfirmedSubscription = this.nutsPlatformService.transactionConfirmedSubject.subscribe(_ => {
      // Each time a new transaction receipt is received, we reload the notifications
      console.log('Receipt received. Reloading notifications....');
      setTimeout(this.reloadNotifications.bind(this), 2000);
      // this.reloadNotifications();
    });
    console.log('Setting interval');
    this.notificationHandler = setInterval(this.reloadNotifications.bind(this), 30000);
  }

  ngOnDestroy() {
    this.transactionConfirmedSubscription.unsubscribe();
    clearInterval(this.notificationHandler);
  }

  openSnackBar(notification: NotificationModel) {
    let snackBarPanelClass = '';
    switch (notification.category) {
      case NotificationCategory.TRANSACTION_INITIATED:
        snackBarPanelClass = 'transaction-initiated-container';
        break;
      case NotificationCategory.TRANSACTION_CONFIRMED:
        snackBarPanelClass = 'transaction-confirmed-container';
        break;
      case NotificationCategory.TRANSACTION_FAILED:
        snackBarPanelClass = 'transaction-failed-container';
        break;
      case NotificationCategory.ASSETS:
        snackBarPanelClass = 'assets-container';
        break;
      case NotificationCategory.EXPIRATION:
        snackBarPanelClass = 'expiration-container';
        break;
      case NotificationCategory.DUE:
        snackBarPanelClass = 'due-container';
        break;
    }
    // let snackBarRef = this.snackBar.open('Approval Successful', 'View More');
    // snackBarRef.afterDismissed().subscribe(dismiss => {
    //   if (dismiss.dismissedByAction) {
    //     this.router.navigate(['/notification']);
    //   }
    // });
    this.zone.run(() => {
      this.snackBar.openFromComponent(NotificationSnackBar, {
        data: {
          category: NotificationCategory.TRANSACTION_CONFIRMED,
          content: 'Approval Successful!'
        },
        panelClass: snackBarPanelClass,
        duration: 5000,
      });
    });
  }

  private reloadNotifications() {
    this.notificationService.getNotifications().subscribe(notifications => {
      console.log('Notification reloaded', notifications);
      // Checks whether the notification list is updated.
      // If notifications length is not the same, it must be updated.
      let updated = notifications.length !== this.notificationService.notifications.length;
      if (!updated) {
        for (let i = 0; i < notifications.length; i++) {
          if (notifications[i].notificationId !== this.notificationService.notifications[i].notificationId) {
            updated = true;
            break;
          }
        }
      }

      if (!updated) {
        console.log('Notifications not updated.');
        return;
      }

      // Check whether are any new unread notifications.
      for (let i = notifications.length - 1; i >= 0; i--) {
        if (notifications[i].status === NotificationStatus.NEW) {
          console.log('New notification', notifications[i]);
          // Don't show snack bar if it's a transaction initiated notification.
          if (notifications[i].category !== NotificationCategory.TRANSACTION_INITIATED) {
            this.openSnackBar(notifications[i]);
          }
          break;
        }
      }

      // Updates the notification list
      this.notificationService.notifications = notifications;
      this.notificationService.notificationUpdatedSubject.next(notifications);
    });
  }

}


@Component({
  selector: 'notification-snack-bar',
  templateUrl: 'notification-snack-bar.html',
  styleUrls: ['./notification-snack-bar.scss'],
})
export class NotificationSnackBar {
  constructor(public snackBarRef: MatSnackBarRef<NotificationSnackBar>,
    @Inject(MAT_SNACK_BAR_DATA) public data: NotificationData, private router: Router,
    private zone: NgZone) { }

  dismiss() {
    this.snackBarRef.dismiss();
  }

  viewMore() {
    this.zone.run(() => {
      this.snackBarRef.dismiss();
      this.router.navigate(['/notification']);
    });
  }
}
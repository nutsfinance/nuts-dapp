import { Component, OnInit, OnDestroy, Inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar, MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

import { NotificationCategory, NotificationModel, NotificationStatus } from './notification/notification.model';
import { NotificationService } from './notification/notification.service';
import { Subscription } from 'rxjs';
import { NutsPlatformService } from './common/web3/nuts-platform.service';
import { MatDialogRef, MatDialog } from '@angular/material';

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
  private networkSubscription: Subscription;

  constructor(private notificationService: NotificationService, private nutsPlatformService: NutsPlatformService,
    private snackBar: MatSnackBar, private dialog: MatDialog, private zone: NgZone) { }

  ngOnInit() {
    this.transactionSentSubscription = this.nutsPlatformService.transactionSentSubject.subscribe(_ => {
      console.log('Transaction sent. Reloading notifications....');
      this.reloadNotifications();
    });
    this.transactionConfirmedSubscription = this.nutsPlatformService.transactionConfirmedSubject.subscribe(_ => {
      // Each time a new transaction receipt is received, we reload the notifications
      console.log('Receipt received. Reloading notifications....');
      setTimeout(this.reloadNotifications.bind(this), 2000);
      // this.reloadNotifications();
    });
    this.networkSubscription = this.nutsPlatformService.currentNetworkSubject.subscribe(currentNetwork => {
      this.zone.run(() => {
        if (currentNetwork != 1 && currentNetwork != 4) {
          this.dialog.open(IncorrectNetworkDialog, { width: '90%' });
        }
      });
    });
    console.log('Setting interval');
    this.notificationHandler = setInterval(this.reloadNotifications.bind(this), 20000);
  }

  ngOnDestroy() {
    this.transactionSentSubscription.unsubscribe();
    this.transactionConfirmedSubscription.unsubscribe();
    this.networkSubscription.unsubscribe();
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
          category: notification.category,
          content: `${notification.title}!`,
        },
        panelClass: snackBarPanelClass,
        duration: 5000,
      });
    });
  }

  private reloadNotifications() {
    this.notificationService.getNotifications().subscribe(notifications => {
      const currentNotifications = this.notificationService.notifications.sort((n1, n2) => n2.creationTimestamp - n1.creationTimestamp);
      const reloadedNotifications = notifications.sort((n1, n2) => n2.creationTimestamp - n1.creationTimestamp);

      // Checks whether the notification list is updated.
      // If notifications length is not the same, it must be updated.
      let updated = reloadedNotifications.length !== currentNotifications.length;
      if (!updated) {
        for (let i = 0; i < reloadedNotifications.length; i++) {
          if (reloadedNotifications[i].notificationId !== currentNotifications[i].notificationId) {
            console.log('Mismatch', i, reloadedNotifications[i].notificationId, currentNotifications[i].notificationId);
            updated = true;
            break;
          }
        }
      }

      if (!updated) {
        console.log('Notifications not updated.');
        return;
      }

      console.log('Current notifications', currentNotifications);
      console.log('Reloaded notifications', reloadedNotifications);
      for (let i = 0; i < reloadedNotifications.length; i++) {
        console.log(i, currentNotifications[i], reloadedNotifications[i]);
      }

      // Check whether are any new unread notifications.
      for (let i = 0; i < reloadedNotifications.length; i++) {
        if (reloadedNotifications[i].status === NotificationStatus.NEW) {
          console.log('New notification', reloadedNotifications[i]);
          // Don't show snack bar if it's a transaction initiated notification.
          if (reloadedNotifications[i].category !== NotificationCategory.TRANSACTION_INITIATED) {
            this.openSnackBar(reloadedNotifications[i]);
          }
          break;
        }
      }

      // Updates the notification list
      this.notificationService.notifications = reloadedNotifications;
      this.notificationService.notificationUpdatedSubject.next(reloadedNotifications);
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


@Component({
  selector: 'app-incorrect-network-dialog',
  templateUrl: './incorrect-network-dialog.component.html',
  styleUrls: ['./incorrect-network-dialog.component.scss']
})
export class IncorrectNetworkDialog implements OnInit {

  constructor(public dialogRef: MatDialogRef<IncorrectNetworkDialog>) { }

  ngOnInit() {
  }

}

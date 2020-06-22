import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { NotificationCategory, NotificationModel } from './notification/notification.model';
import { NotificationService } from './notification/notification.service';
import { Subscription } from 'rxjs';
import { NutsPlatformService } from './common/web3/nuts-platform.service';
import { MatDialog } from '@angular/material';
import { TokenService } from './common/token/token.service';
import { NotificationSnackbarComponent } from './notification/notification-snackbar/notification-snackbar.component';
import { DisconnectedDialog } from './common/disconnected-dialog/disconnected-dialog.component';
import { IncorrectNetworkDialog } from './common/incorrect-network-dialog/incorrect-network-dialog.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  private newNotificationSubscription: Subscription;
  private platformInitializedSubscription: Subscription;
  private networkSubscription: Subscription;

  constructor(private notificationService: NotificationService, private nutsPlatformService: NutsPlatformService,
    private snackBar: MatSnackBar, private dialog: MatDialog, private zone: NgZone) { }

  ngOnInit() {
    this.newNotificationSubscription = this.notificationService.newNotificationSubject.subscribe(newNotification => {
      // Don't show snack bar if it's a transaction initiated notification.
      if (newNotification.category === NotificationCategory.TRANSACTION_INITIATED)  return;
      // Don't show snack bar if there is no snack message
      if (!newNotification.snackBarMessage) return;
      this.zone.run(() => {
        this.openSnackBar(newNotification);
      });
    });

    // Wait until the platform is intialized
    this.platformInitializedSubscription = this.nutsPlatformService.platformInitializedSubject.subscribe(initialized => {
      if (!initialized) {
        console.log('Platform not initialized.');
        this.zone.run(() => this.dialog.open(DisconnectedDialog, { width: '90%' }));
      } else {
        this.networkSubscription = this.nutsPlatformService.currentNetworkSubject.subscribe(currentNetwork => {
          this.zone.run(() => {
            this.dialog.closeAll();
            console.log('App network changed', this.nutsPlatformService.currentAccount, this.nutsPlatformService.currentNetwork);
            // If the account is set(wallet is connected) but the network is not supported, show the incorrect network dialog
            if (!this.nutsPlatformService.isNetworkValid()) {
              this.dialog.open(IncorrectNetworkDialog, { width: '90%' });
            }
          });
        });
      }
    });

    // this.notificationService.notificationUpdatedSubject.subscribe(_ => {
    //   console.log('Updated');
    //   if (this.notificationService.notifications.length == 0) return;
    //   this.openSnackBar(this.notificationService.notifications[0]);
    // });
  
    // this.openSnackBar(new NotificationModel('', '', '', 0, 0, 0, NotificationCategory.TRANSACTION_CONFIRMED, NotificationStatus.NEW,
    //   'Offer Creation Successful', '', TransactionType.CREATE_OFFER, {}));
  }

  ngOnDestroy() {
    this.newNotificationSubscription.unsubscribe();
    this.platformInitializedSubscription.unsubscribe();
    this.networkSubscription.unsubscribe();
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
      this.snackBar.openFromComponent(NotificationSnackbarComponent, {
        data: notification,
        panelClass: snackBarPanelClass,
        duration: 5000,
      });
    });
  }

}
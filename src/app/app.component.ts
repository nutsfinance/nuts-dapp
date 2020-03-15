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
  private newNotificationSubscription: Subscription;
  private accountSubscription: Subscription;
  private networkSubscription: Subscription;

  constructor(private notificationService: NotificationService, private nutsPlatformService: NutsPlatformService,
    private snackBar: MatSnackBar, private dialog: MatDialog, private zone: NgZone) { }

  ngOnInit() {
    this.newNotificationSubscription = this.notificationService.newNotificationSubject.subscribe(newNotification => {
      this.zone.run(() => {
        // Don't show snack bar if it's a transaction initiated notification.
        if (newNotification.category !== NotificationCategory.TRANSACTION_INITIATED) {
          this.openSnackBar(newNotification);
        }
      });
    });
    this.accountSubscription = this.nutsPlatformService.currentAccountSubject.subscribe(currentAccount => {
      this.zone.run(() => {
        console.log(this.nutsPlatformService.currentAccount, this.nutsPlatformService.currentNetwork);
        this.dialog.closeAll();
        // If the account is not set(wallet is disconnected), show the disconnected dialog
        if (!this.nutsPlatformService.isAddressValid()) {
          this.dialog.open(DisconnectedDialog, { width: '90%' });
        } else if (!this.nutsPlatformService.isNetworkValid()) {
          this.dialog.open(IncorrectNetworkDialog, { width: '90%' });
        }
      });
    });
    this.networkSubscription = this.nutsPlatformService.currentNetworkSubject.subscribe(currentNetwork => {
      this.zone.run(() => {
        this.dialog.closeAll();
        console.log(this.nutsPlatformService.currentAccount, this.nutsPlatformService.currentNetwork);
        // If the account is set(wallet is connected) but the network is not supported, show the incorrect network dialog
        if (this.nutsPlatformService.isAddressValid() && !this.nutsPlatformService.isNetworkValid()) {
          this.dialog.open(IncorrectNetworkDialog, { width: '90%' });
        }
      });
    });
  }

  ngOnDestroy() {
    this.newNotificationSubscription.unsubscribe();
    this.accountSubscription.unsubscribe();
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

@Component({
  selector: 'app-disconnected-dialog',
  templateUrl: './disconnected-dialog.component.html',
  styleUrls: ['./disconnected-dialog.component.scss']
})
export class DisconnectedDialog implements OnInit {

  constructor(public dialogRef: MatDialogRef<DisconnectedDialog>, private nutsPlatformService: NutsPlatformService) { }

  ngOnInit() {
  }

  connectWallet() {
    this.dialogRef.close();
    this.nutsPlatformService.connectToEthereum();
  }
}

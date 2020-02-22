import { Component, OnInit, OnDestroy, Inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

import { Subscription } from 'rxjs';

import { NutsPlatformService } from '../common/web3/nuts-platform.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationStatus, NotificationModel, NotificationCategory } from '../notification/notification.model';
import { NotificationDialog } from '../notification/notification-dialog/notification-dialog.component';

export interface TransactionData {
  transactionHash: string,
  transactionLink: string,
  transactionShortHash: string,
}

export interface NotificationData {
  category: NotificationCategory,
  content: string,
}

@Component({
  selector: 'app-instrument',
  templateUrl: './instrument.component.html',
  styleUrls: ['./instrument.component.scss']
})
export class InstrumentComponent implements OnInit, OnDestroy {
  private language: string = 'English';

  private transactionSentSubscription: Subscription;
  private transactionConfirmedSubscription: Subscription;
  private transactionPendingDialog: MatDialogRef<TransactionPendingDialog>;
  private transactionCompleteDialog: MatDialogRef<TransactionCompleteDialog>;

  private notificationHandler;
  private unreadNotifications: NotificationModel[] = [];
  private notificationSubscription: Subscription;
  private notificationDialog: MatDialogRef<NotificationDialog>;

  constructor(private _bottomSheet: MatBottomSheet, private dialog: MatDialog, private snackBar: MatSnackBar,
    private zone: NgZone, private nutsPlatformService: NutsPlatformService,
    private notificationService: NotificationService) { }

  ngOnInit() {
    this.transactionSentSubscription = this.nutsPlatformService.transactionSentSubject.subscribe((transactionHash) => {
      console.log(transactionHash);
      this.zone.run(() => {
        this.transactionPendingDialog = this.dialog.open(TransactionPendingDialog, {
          width: '250px',
          data: this.getTransactionData(transactionHash)
        });
      });
    });

    this.transactionConfirmedSubscription = this.nutsPlatformService.transactionConfirmedSubject.subscribe((transactionHash) => {
      this.zone.run(() => {
        this.transactionPendingDialog.close();
        this.transactionCompleteDialog = this.dialog.open(TransactionCompleteDialog, {
          width: '250px',
          data: this.getTransactionData(transactionHash)
        });
      });
    });

    this.notificationSubscription = this.notificationService.notificationUpdatedSubject.subscribe(notifications => {
      this.unreadNotifications = notifications.filter(notification => notification.status === NotificationStatus.NEW)
        .sort((n1, n2) => n2.creationTimestamp - n1.creationTimestamp);
    });

    console.log('Setting interval');
    this.notificationHandler = setInterval(this.reloadNotifications.bind(this), 10000);
  }

  ngOnDestroy() {
    this.transactionSentSubscription.unsubscribe();
    this.transactionConfirmedSubscription.unsubscribe();
    this.notificationSubscription.unsubscribe();
    clearInterval(this.notificationHandler);
  }

  getTransactionData(transactionHash: string): TransactionData {
    return {
      transactionHash,
      transactionLink: this.getTransactionLink(transactionHash),
      transactionShortHash: `${transactionHash.slice(0, 5)}....${transactionHash.slice(transactionHash.length - 5)}`,
    };
  }

  getTransactionLink(transactionHash: string) {
    return `https://etherscan.io/tx/${transactionHash}`;
  }

  openLanguageBottomSheet(): void {
    this._bottomSheet.open(LanguageSelectSheet);

    const bottomSheetRef = this._bottomSheet.open(LanguageSelectSheet);
    bottomSheetRef.afterDismissed().subscribe(language => {
      // Ignore if the bottom sheet is closed by clicking empty spaces.
      if (language) {
        console.log(language);
        this.language = language;
      }
    });
  }

  openNotificationDialog() {
    this.dialog.open(NotificationDialog, {
      width: '90%',
      data: this.unreadNotifications,
      position: {
        top: '100px'
      }
    });
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
    this.snackBar.openFromComponent(NotificationSnackBar, {
      data: {
        category: NotificationCategory.TRANSACTION_CONFIRMED,
        content: 'Approval Successful!'
      },
      panelClass: snackBarPanelClass,
      duration: 5000,
    });
  }

  reloadNotifications() {
    console.log('Reloading notification');
    this.notificationService.getNotifications().subscribe(notifications => {
      console.log(notifications);
      // If the notification amount is not changed, no op.
      if (notifications.length === this.notificationService.notifications.length) return;

      // Check whether are any new unread notifications.
      for (let i = notifications.length - 1; i >= this.notificationService.notifications.length; i--) {
        if (notifications[i].status === NotificationStatus.NEW) {
          console.log('New notification', notifications[i]);
          this.openSnackBar(notifications[i]);
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
  selector: 'app-language-select-sheet',
  templateUrl: './language-select-sheet.html'
})
export class LanguageSelectSheet {

  constructor(private _bottomSheetRef: MatBottomSheetRef<InstrumentComponent>) { }

  selectLanguage(language: string): void {
    console.log(language);
    this._bottomSheetRef.dismiss(language);
    event.preventDefault();
  }

}

@Component({
  selector: 'transaction-pending-dialog',
  templateUrl: 'transaction-pending-dialog.html',
  styleUrls: ['./instrument.component.scss'],
})
export class TransactionPendingDialog {

  constructor(
    public dialogRef: MatDialogRef<TransactionPendingDialog>,
    @Inject(MAT_DIALOG_DATA) public data: TransactionData) { }
}

@Component({
  selector: 'transaction-complete-dialog',
  templateUrl: 'transaction-complete-dialog.html',
  styleUrls: ['./instrument.component.scss'],
})
export class TransactionCompleteDialog {

  constructor(public dialogRef: MatDialogRef<TransactionCompleteDialog>,
    @Inject(MAT_DIALOG_DATA) public data: TransactionData) { }

  closeDialog() {
    console.log('Closing');
    this.dialogRef.close();
    console.log('Should close');
  }
}

@Component({
  selector: 'notification-snack-bar',
  templateUrl: 'notification-snack-bar.html',
  styleUrls: ['./notification-snack-bar.scss'],
})
export class NotificationSnackBar {
  constructor(public snackBarRef: MatSnackBarRef<NotificationSnackBar>,
    @Inject(MAT_SNACK_BAR_DATA) public data: NotificationData, private router: Router) { }

  dismiss() {
    this.snackBarRef.dismiss();
  }

  viewMore() {
    this.snackBarRef.dismiss();
    this.router.navigate(['/notification']);
  }
}
import { Component, OnInit, OnDestroy, Inject, NgZone } from '@angular/core';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { Subscription } from 'rxjs';

import { NutsPlatformService } from '../common/web3/nuts-platform.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationStatus, NotificationModel } from '../notification/notification.model';
import { NotificationDialog } from '../notification/notification-dialog/notification-dialog.component';

export interface TransactionData {
  transactionHash: string,
  transactionLink: string,
  transactionShortHash: string,
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

  private unreadNotifications: NotificationModel[] = [];
  private notificationSubscription: Subscription;
  private notificationDialog: MatDialogRef<NotificationDialog>;

  constructor(private _bottomSheet: MatBottomSheet, private dialog: MatDialog, private zone: NgZone,
              private nutsPlatformService: NutsPlatformService, private notificationService: NotificationService) { }

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
  }

  ngOnDestroy() {
    this.transactionSentSubscription.unsubscribe();
    this.transactionConfirmedSubscription.unsubscribe();
    this.notificationSubscription.unsubscribe();
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

  constructor(
    public dialogRef: MatDialogRef<TransactionCompleteDialog>,
    @Inject(MAT_DIALOG_DATA) public data: TransactionData) { }

    closeDialog() {
      console.log('Closing');
      this.dialogRef.close();
      console.log('Should close');
    }
}


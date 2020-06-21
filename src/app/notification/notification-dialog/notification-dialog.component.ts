import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

import { environment } from 'src/environments/environment';
import { NotificationModel, NotificationReadStatus } from '../notification.model';
import { NutsPlatformService } from 'src/app/common/web3/nuts-platform.service';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-notification-dialog',
  templateUrl: './notification-dialog.component.html',
  styleUrls: ['./notification-dialog.component.scss']
})
export class NotificationDialog implements OnInit, OnDestroy {
  public language = environment.language;

  private notificationSubscription: Subscription;

  constructor(public dialogRef: MatDialogRef<NotificationDialog>, @Inject(MAT_DIALOG_DATA) public notifications: NotificationModel[],
    private nutsPlatformService: NutsPlatformService, private notificationService: NotificationService) { }

  ngOnInit() {
    this.notificationSubscription = this.notificationService.notificationUpdatedSubject.subscribe((notifications) => {
      this.notifications = notifications.filter(notification => notification.readStatus === NotificationReadStatus.NEW)
        .sort((n1, n2) => n2.creationTimestamp - n1.creationTimestamp);
    });
  }

  ngOnDestroy() {
    this.notificationSubscription.unsubscribe();
  }

  closeDialog() {
    this.dialogRef.close();
  }

  getEtherscanLink(transactionHash: string): string {
    switch (this.nutsPlatformService.currentNetwork) {
      case '1':
        return `https://etherscan.io/tx/${transactionHash}`;
      case '3':
        return `https://ropsten.etherscan.io/tx/${transactionHash}`;
      case '4':
        return `https://rinkeby.etherscan.io/tx/${transactionHash}`;
      case '42':
        return `https://kovan.etherscan.io/tx/${transactionHash}`;
      default:
        return '';
    }
  }

  getTransactionShortHash(transactionHash: string): string {
    return `[${transactionHash.slice(0, 6)}...${transactionHash.slice(transactionHash.length - 4)}]`;
  }

  onNotificationAction(notification: NotificationModel) {
    this.dialogRef.close();
    this.notificationService.handleNotificationAction(notification);
  }

  markAllRead() {
    for (let notification of this.notifications) {
      notification.readStatus = NotificationReadStatus.READ;
    }
    this.notificationService.updateNotifications(this.notifications);
  }
}

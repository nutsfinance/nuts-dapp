import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { NotificationModel, NotificationStatus } from '../notification.model';
import { NutsPlatformService } from 'src/app/common/web3/nuts-platform.service';
import { TransactionType } from '../transaction.model';
import { NotificationService } from '../notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-dialog',
  templateUrl: './notification-dialog.component.html',
  styleUrls: ['./notification-dialog.component.scss']
})
export class NotificationDialog implements OnInit, OnDestroy {
  private notificationSubscription: Subscription;

  constructor(public dialogRef: MatDialogRef<NotificationDialog>,
    @Inject(MAT_DIALOG_DATA) public notifications: NotificationModel[],
    private nutsPlatformService: NutsPlatformService, private router: Router,
    private notificationService: NotificationService) { }

  ngOnInit() {
    this.notificationSubscription = this.notificationService.notificationUpdatedSubject.subscribe((notifications) => {
      this.notifications = notifications.filter(notification => notification.status === 'NEW')
      .sort((n1, n2) => n2.creationTimestamp - n1.creationTimestamp);
    });
  }

  ngOnDestroy() {
    this.notificationSubscription.unsubscribe();
  }

  closeDialog() {
    console.log('Closing');
    this.dialogRef.close();
    console.log('Should close');
  }

  getEtherscanLink(transactionHash: string): string {
    switch(this.nutsPlatformService.currentNetwork) {
      case 1:
        return `https://etherscan.io/tx/${transactionHash}`;
      case 3:
        return `https://ropsten.etherscan.io/tx/${transactionHash}`;
      case 4:
        return `https://rinkeby.etherscan.io/tx/${transactionHash}`;
      case 42:
        return `https://kovan.etherscan.io/tx/${transactionHash}`;
      default:
        return '';
    }
  }

  getTransactionShortHash(transactionHash: string): string {
    return `[${transactionHash.slice(0, 6)}...${transactionHash.slice(transactionHash.length - 4)}]`;
  }

  retryTransaction(notification: NotificationModel) {

  }

  onNotificationAction(notification: NotificationModel) {
    this.dialogRef.close();
    // Mark the notification as READ
    notification.status = NotificationStatus.READ;
    this.notificationService.updateNotification(notification);
    const instrumentName = this.nutsPlatformService.getInstrumentById(+notification.instrumentId);
    console.log(instrumentName);

    switch (notification.type) {
      case TransactionType.APPROVE:
        this.router.navigate([`/instrument/${instrumentName}/wallet`], {
          queryParams: {
            panel: 'deposit',
            token: notification.metadata['tokenName'],
            amount: notification.metadata['amount'],
            showApprove: false
          }
        });
        break;
      case TransactionType.DEPOSIT:
      case TransactionType.WITHDRAW:
        this.router.navigate([`/instrument/${instrumentName}/wallet`], { queryParams: { panel: 'transactions' } });
        break;
      case TransactionType.CREATE_OFFER:
        this.router.navigate([`/instrument/${instrumentName}/positions`], { queryParams: { tab: 'engageable' } });
        break;
      case TransactionType.CANCEL_OFFER:
        this.router.navigate([`/instrument/${instrumentName}/positions`], { queryParams: { tab: 'inactive' } });
        break;
    }
  }

  getNotificationAction(notification: NotificationModel): string {
    if (notification.type === TransactionType.APPROVE) {
      return 'Deposit';
    }

    return 'View';
  }

  markAllRead() {
    for (let notification of this.notifications) {
      notification.status = NotificationStatus.READ;
    }
    this.notificationService.updateNotifications(this.notifications);
  }
}

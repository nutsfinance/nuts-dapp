import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { NotificationModel } from '../notification.model';
import { NutsPlatformService } from 'src/app/common/web3/nuts-platform.service';
import { TransactionType } from '../transaction.model';

@Component({
  selector: 'app-notification-dialog',
  templateUrl: './notification-dialog.component.html',
  styleUrls: ['./notification-dialog.component.scss']
})
export class NotificationDialog implements OnInit {

  constructor(public dialogRef: MatDialogRef<NotificationDialog>,
    @Inject(MAT_DIALOG_DATA) public notifications: NotificationModel[],
    private nutsPlatformService: NutsPlatformService, private router: Router) { }

  ngOnInit() {
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
    return `[${transactionHash.slice(0, 5)}...${transactionHash.slice(transactionHash.length - 4)}]`;
  }

  retryTransaction(notification: NotificationModel) {

  }

  onNotificationAction(notification: NotificationModel) {
    this.dialogRef.close();
    if (notification.type === TransactionType.APPROVE) {
      this.router.navigate([`/instrument/${notification.metadata['instrumentName']}/wallet`], {queryParams: {
        panel: 'deposit',
        token: notification.metadata['tokenName'],
        amount: notification.metadata['amount'],
        showApprove: false
      }});
    } else if (notification.type === TransactionType.DEPOSIT || notification.type === TransactionType.WITHDRAW) {
      this.router.navigate([`/instrument/${notification.metadata['instrumentName']}/wallet`], {queryParams: {panel: 'transactions'}});
    }
  }

  getNotificationAction(notification: NotificationModel): string {
    if (notification.type === TransactionType.APPROVE) {
      return 'Deposit';
    }

    return 'View';
  }
}

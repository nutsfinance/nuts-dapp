import { Component, OnInit, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';

import { NotificationModel, NotificationStatus } from '../notification.model';
import { MatCheckboxChange } from '@angular/material';
import { NutsPlatformService } from 'src/app/common/web3/nuts-platform.service';
import { TransactionType } from '../transaction.model';

@Component({
  selector: 'app-notification-row',
  templateUrl: './notification-row.component.html',
  styleUrls: ['./notification-row.component.scss']
})
export class NotificationRowComponent implements OnInit, OnChanges {
  @Input() notification: NotificationModel;
  @Input() showSelect: boolean;
  @Output() statusUpdated = new EventEmitter<{id: string, status: NotificationStatus}>();
  private notificationStatus: NotificationStatus;

  constructor(private nutsPlatformService: NutsPlatformService, private router: Router) { }

  ngOnInit() {
    this.notificationStatus = this.notification.status;
  }

  ngOnChanges(changes: SimpleChanges) {
    this.showSelect = changes.showSelect.currentValue;
    // Refreshes the notification status when select/cancel is clicked.
    this.notificationStatus = this.notification.status;
  }
  
  onStatusChanged(change: MatCheckboxChange) {
    this.notificationStatus = change.checked ? NotificationStatus.READ : NotificationStatus.NEW;
    this.statusUpdated.next({id: this.notification.notificationId, status: this.notificationStatus});
  }

  getEtherscanLink(): string {
    switch(this.nutsPlatformService.currentNetwork) {
      case 1:
        return `https://etherscan.io/tx/${this.notification.transactionHash}`;
      case 3:
        return `https://ropsten.etherscan.io/tx/${this.notification.transactionHash}`;
      case 4:
        return `https://rinkeby.etherscan.io/tx/${this.notification.transactionHash}`;
      case 42:
        return `https://kovan.etherscan.io/tx/${this.notification.transactionHash}`;
      default:
        return '';
    }
  }

  getTransactionShortHash(): string {
    const transactionHash = this.notification.transactionHash;
    return `[${transactionHash.slice(0, 5)}...${transactionHash.slice(transactionHash.length - 4)}]`;
  }

  retryTransaction() {

  }

  onNotificationAction() {
    if (this.notification.type === TransactionType.APPROVE) {
      this.router.navigate([`/instrument/${this.notification.metadata['instrumentName']}/wallet`], {queryParams: {
        panel: 'deposit',
        token: this.notification.metadata['tokenName'],
        amount: this.notification.metadata['amount'],
        showApprove: false
      }});
    } else if (this.notification.type === TransactionType.DEPOSIT || this.notification.type === TransactionType.WITHDRAW) {
      this.router.navigate([`/instrument/${this.notification.metadata['instrumentName']}/wallet`], {queryParams: {panel: 'transactions'}});
    }
  }

  getNotificationAction(): string {
    if (this.notification.type === TransactionType.APPROVE) {
      return 'Deposit';
    }

    return 'View';
  }
}

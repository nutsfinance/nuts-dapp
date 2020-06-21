import { Component, OnInit, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';

import { NotificationModel, NotificationReadStatus } from '../notification.model';
import { MatCheckboxChange } from '@angular/material';
import { NutsPlatformService } from 'src/app/common/web3/nuts-platform.service';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-notification-row',
  templateUrl: './notification-row.component.html',
  styleUrls: ['./notification-row.component.scss']
})
export class NotificationRowComponent implements OnInit, OnChanges {
  @Input() public notification: NotificationModel;
  @Input() public showSelect: boolean;
  @Output() public statusUpdated = new EventEmitter<{ id: string, readStatus: NotificationReadStatus }>();
  public notificationStatus: NotificationReadStatus;

  constructor(private nutsPlatformService: NutsPlatformService, public notificationService: NotificationService) { }

  ngOnInit() {
    this.notificationStatus = this.notification.readStatus;
  }

  ngOnChanges(changes: SimpleChanges) {
    this.showSelect = changes.showSelect.currentValue;
    // Refreshes the notification status when select/cancel is clicked.
    this.notificationStatus = this.notification.readStatus;
  }

  onStatusChanged(change: MatCheckboxChange) {
    this.notificationStatus = change.checked ? NotificationReadStatus.READ : NotificationReadStatus.NEW;
    this.statusUpdated.next({ id: this.notification.notificationId, readStatus: this.notificationStatus });
  }

  getEtherscanLink(): string {
    switch (this.nutsPlatformService.currentNetwork) {
      case '1':
        return `https://etherscan.io/tx/${this.notification.transactionHash}`;
      case '3':
        return `https://ropsten.etherscan.io/tx/${this.notification.transactionHash}`;
      case '4':
        return `https://rinkeby.etherscan.io/tx/${this.notification.transactionHash}`;
      case '42':
        return `https://kovan.etherscan.io/tx/${this.notification.transactionHash}`;
      default:
        return '';
    }
  }

  getTransactionShortHash(): string {
    const transactionHash = this.notification.transactionHash;
    return `[${transactionHash.slice(0, 6)}...${transactionHash.slice(transactionHash.length - 4)}]`;
  }
}

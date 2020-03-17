import { Component, OnInit, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';

import { NotificationModel, NotificationStatus } from '../notification.model';
import { MatCheckboxChange } from '@angular/material';
import { NutsPlatformService } from 'src/app/common/web3/nuts-platform.service';
import { TransactionType } from '../transaction.model';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-notification-row',
  templateUrl: './notification-row.component.html',
  styleUrls: ['./notification-row.component.scss']
})
export class NotificationRowComponent implements OnInit, OnChanges {
  @Input() public notification: NotificationModel;
  @Input() public showSelect: boolean;
  @Output() public statusUpdated = new EventEmitter<{ id: string, status: NotificationStatus }>();
  public notificationStatus: NotificationStatus;

  constructor(private nutsPlatformService: NutsPlatformService, private notificationService: NotificationService,
    private router: Router) { }

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
    this.statusUpdated.next({ id: this.notification.notificationId, status: this.notificationStatus });
  }

  getEtherscanLink(): string {
    switch (this.nutsPlatformService.currentNetwork) {
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
    return `[${transactionHash.slice(0, 6)}...${transactionHash.slice(transactionHash.length - 4)}]`;
  }

  retryTransaction() {
    this.nutsPlatformService.retryTransaction(this.notification.transactionHash);
  }

  onNotificationAction() {
    console.log(this.notification);
    // Mark notification as READ
    this.notification.status = NotificationStatus.READ;
    this.notificationService.updateNotification(this.notification);
    const instrumentName = this.nutsPlatformService.getInstrumentById(+this.notification.instrumentId);
    console.log(instrumentName);

    switch (this.notification.type) {
      case TransactionType.APPROVE:
        this.router.navigate([`/instrument/${instrumentName}/wallet`], {
          queryParams: {
            panel: 'deposit',
            token: this.notification.metadata['tokenName'],
            amount: this.notification.metadata['amount'],
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
      case TransactionType.ACCEPT_OFFER:
        this.router.navigate([`/instrument/${instrumentName}/positions`], { queryParams: { tab: 'engaged' } });
        break;
      case TransactionType.PAY_OFFER:
        this.router.navigate([`/instrument/${instrumentName}/positions`]);
        break;
    }
  }

  getNotificationAction(): string {
    if (this.notification.type === TransactionType.APPROVE) {
      return 'Deposit';
    }

    return 'View';
  }
}

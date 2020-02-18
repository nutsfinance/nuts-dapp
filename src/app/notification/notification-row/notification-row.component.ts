import { Component, OnInit, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';

import { NotificationModel, NotificationStatus } from '../notification.model';
import { MatCheckboxChange } from '@angular/material';

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

  constructor() { }

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

  openEtherScan() {
    console.log('Open Ether scan');
    return false;
  }
}

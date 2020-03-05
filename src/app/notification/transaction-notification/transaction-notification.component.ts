import { Component, OnInit, Input } from '@angular/core';
import { NotificationModel, NotificationStatus } from '../notification.model';

import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-transaction-notification',
  templateUrl: './transaction-notification.component.html',
  styleUrls: ['./transaction-notification.component.scss']
})
export class TransactionNotificationComponent implements OnInit {
  @Input() notifications: NotificationModel[] = [];
  private notificationStatusUpdate: {[id: string]: NotificationStatus} = {};
  private showSelect = false;

  constructor(private notificationService: NotificationService) { }

  ngOnInit() {
  }

  onNotificationStatusUpdated(update: {id: string, status: NotificationStatus}) {
    this.notificationStatusUpdate[update.id] = update.status;
  }

  saveNotifications() {
    console.log(this.notificationStatusUpdate);
    const notificationsToUpdate: NotificationModel[] = [];
    for (let notification of this.notifications) {
      if (notification.notificationId in this.notificationStatusUpdate) {
        notification.status = this.notificationStatusUpdate[notification.notificationId];
        notificationsToUpdate.push(notification);
      }
    }
    this.notificationService.updateNotifications(notificationsToUpdate);
    this.showSelect = false;
  }

}

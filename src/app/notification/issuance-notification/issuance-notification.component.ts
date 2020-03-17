import { Component, OnInit, Input } from '@angular/core';
import { NotificationModel, NotificationStatus } from '../notification.model';

import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-issuance-notification',
  templateUrl: './issuance-notification.component.html',
  styleUrls: ['./issuance-notification.component.scss']
})
export class IssuanceNotificationComponent implements OnInit {
  @Input() public notifications: NotificationModel[] = [];
  public showSelect = false;
  
  private notificationStatusUpdate: {[id: string]: NotificationStatus} = {};

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

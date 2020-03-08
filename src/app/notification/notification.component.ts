import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';

import { NotificationService } from './notification.service';
import { NotificationModel, NotificationStatus } from './notification.model';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit, OnDestroy {
  private showAll = false;
  private showSelect = false;
  private notifications: NotificationModel[] = [];
  private notificationSubscription: Subscription;
  private notificationStatusUpdate: {[id: string]: NotificationStatus} = {};

  constructor(private location: Location, private zone: NgZone, private notificationService: NotificationService) { }

  ngOnInit() {
    this.updateNotifications();
    this.notificationSubscription = this.notificationService.notificationUpdatedSubject.subscribe(notifications => {
      this.updateNotifications();
    });
  }
  
  ngOnDestroy() {
    this.notificationSubscription.unsubscribe();
  }

  navigateBack() {
    this.location.back();
  }

  toggleShowAll() {
    this.showAll = !this.showAll;
    this.updateNotifications();
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

  private updateNotifications() {
    this.zone.run(() => {
      if (this.showAll) {
        this.notifications = this.notificationService.notifications
          .sort((n1, n2) => n2.creationTimestamp - n1.creationTimestamp);
      } else {
        this.notifications = this.notificationService.notifications
          .filter(notification => notification.status === 'NEW')
          .sort((n1, n2) => n2.creationTimestamp - n1.creationTimestamp);
      }
    });
  }
}

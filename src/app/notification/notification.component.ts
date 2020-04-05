import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';

import { NotificationService } from './notification.service';
import { NotificationModel, NotificationReadStatus } from './notification.model';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit, OnDestroy {
  public showAll = false;
  public showSelect = false;
  public notifications: NotificationModel[] = [];
  
  private notificationSubscription: Subscription;
  private notificationReadStatusUpdate: {[id: string]: NotificationReadStatus} = {};

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

  onNotificationStatusUpdated(update: {id: string, readStatus: NotificationReadStatus}) {
    this.notificationReadStatusUpdate[update.id] = update.readStatus;
  }

  saveNotifications() {
    console.log(this.notificationReadStatusUpdate);
    const notificationsToUpdate: NotificationModel[] = [];
    for (let notification of this.notifications) {
      if (notification.notificationId in this.notificationReadStatusUpdate) {
        notification.readStatus = this.notificationReadStatusUpdate[notification.notificationId];
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
          .filter(notification => notification.readStatus === NotificationReadStatus.NEW)
          .sort((n1, n2) => n2.creationTimestamp - n1.creationTimestamp);
      }
    });
  }
}

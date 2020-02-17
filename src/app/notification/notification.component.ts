import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';

import { NotificationService } from './notification.service';
import { NotificationModel, NotificationCategory, NotificationStatus } from './notification.model';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit, OnDestroy {
  private showAll = false;
  private notifications: NotificationModel[] = [];
  private notificationSubscription: Subscription;

  constructor(private location: Location, private notificationService: NotificationService) { }

  ngOnInit() {
    this.updateNotifications();
    this.notificationSubscription = this.notificationService.notificationUpdatedSubject.subscribe(notifications => {
      this.notifications = notifications;
    });
  }
  
  ngOnDestroy() {
    this.updateNotifications();
  }

  navigateBack() {
    this.location.back();
  }

  toggleShowAll() {
    this.showAll = !this.showAll;
    this.updateNotifications();
  }

  private updateNotifications() {
    if (this.showAll) {
      this.notifications = this.notificationService.notifications;
    } else {
      this.notifications = this.notificationService.notifications.filter(notification => notification.status === 'NEW');
    }
  }
}

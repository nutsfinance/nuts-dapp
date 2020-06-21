import { Component, OnInit, OnDestroy } from '@angular/core';
import { GlobalNotificationModel } from '../global-notification.model';
import { Subscription } from 'rxjs';
import { NotificationService } from '../notification.service';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { NutsPlatformService } from 'src/app/common/web3/nuts-platform.service';

@Component({
  selector: 'app-notification-banner',
  templateUrl: './notification-banner.component.html',
  styleUrls: ['./notification-banner.component.scss']
})
export class NotificationBannerComponent implements OnInit, OnDestroy {
  public globalNotifications: GlobalNotificationModel[];

  private globalNotificationSubscription: Subscription;

  constructor(private notificationService: NotificationService, private nutsPlatformService: NutsPlatformService,
    private router: Router) { }

  ngOnInit() {
    this.globalNotificationSubscription = this.notificationService.globalNotificationUpdatedSubject
      .subscribe(globalNotifications => this.globalNotifications = globalNotifications);
  }

  ngOnDestroy() {
    this.globalNotificationSubscription.unsubscribe();
  }

  viewSubscription(globalNotification: GlobalNotificationModel) {
    const instrumentName = this.nutsPlatformService.getInstrumentById(+globalNotification.instrumentId);
    this.router.navigate([`/${environment.language}/instrument/${instrumentName}/marketplace`],
      { fragment: `ipo-${this.globalNotifications[0].subscriptionId}` });
    this.notificationService.updateGlobalNotification(this.globalNotifications[0]);
  }

  dismiss() {
    this.notificationService.updateGlobalNotification(this.globalNotifications[0]);
  }
}

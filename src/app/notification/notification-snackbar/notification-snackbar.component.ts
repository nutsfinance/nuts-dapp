import { Component, OnInit, Inject, NgZone } from '@angular/core';
import { MatSnackBarRef, MAT_SNACK_BAR_DATA } from '@angular/material';
import { Router } from '@angular/router';
import { NotificationModel } from '../notification.model';
import { environment } from 'src/environments/environment';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-notification-snackbar',
  templateUrl: './notification-snackbar.component.html',
  styleUrls: ['./notification-snackbar.component.scss']
})
export class NotificationSnackbarComponent implements OnInit {

  constructor(public snackBarRef: MatSnackBarRef<NotificationSnackbarComponent>,
    @Inject(MAT_SNACK_BAR_DATA) public notification: NotificationModel, private notificationService: NotificationService,
    private zone: NgZone) { }

  ngOnInit() { }

  handleNotificationAction() {
    this.zone.run(() => {
      this.snackBarRef.dismiss();
      this.notificationService.handleNotificationAction(this.notification);
    });
  }

}
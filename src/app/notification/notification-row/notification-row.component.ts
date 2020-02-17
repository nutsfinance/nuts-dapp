import { Component, OnInit, Input } from '@angular/core';

import { NotificationModel } from '../notification.model';

@Component({
  selector: 'app-notification-row',
  templateUrl: './notification-row.component.html',
  styleUrls: ['./notification-row.component.scss']
})
export class NotificationRowComponent implements OnInit {
  @Input() notification: NotificationModel;

  constructor() { }

  ngOnInit() {
  }

}

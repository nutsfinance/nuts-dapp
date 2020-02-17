import { Component, OnInit } from '@angular/core';

import { NotificationModel, NotificationCategory, NotificationStatus } from './notification.model';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit {
  private notifications: NotificationModel[] = [
    {
        "notificationId": "5e473868f8abc8066f11c201",
        "userAddress": "0x2932516d9564cb799dda2c16559cad5b8357a0d6",
        "creationTimestamp": 1581725800478,
        "instrumentId": 2,
        "issuanceId": null,
        "category": NotificationCategory.TRANSACTION_INITIATED,
        "status": NotificationStatus.NEW,
        "message": "Your withdrawal request for 1 ${tokenName} has been initiated [####].",
        "title": "Withdrawal request initiated"
    },
    {
        "notificationId": "5e47386ef8abc8066f11c202",
        "userAddress": "0x2932516d9564cb799dda2c16559cad5b8357a0d6",
        "creationTimestamp": 1581725806504,
        "instrumentId": 2,
        "issuanceId": null,
        "category": NotificationCategory.TRANSACTION_CONFIRMED,
        "status": NotificationStatus.NEW,
        "message": "Your withdrawal request for 1000000000000000000 ETH was successful [####].",
        "title": "Withdrawal successful"
    },
    {
        "notificationId": "5e478fee83ef7b5fbaef9e58",
        "userAddress": "0x2932516d9564cb799dda2c16559cad5b8357a0d6",
        "creationTimestamp": 1581748206242,
        "instrumentId": 2,
        "issuanceId": null,
        "category": NotificationCategory.TRANSACTION_INITIATED,
        "status": NotificationStatus.NEW,
        "message": "Your withdrawal request for 1 ${tokenName} has been initiated [####].",
        "title": "Withdrawal request initiated"
    },
    {
        "notificationId": "5e478ff283ef7b5fbaef9e59",
        "userAddress": "0x2932516d9564cb799dda2c16559cad5b8357a0d6",
        "creationTimestamp": 1581748210897,
        "instrumentId": 2,
        "issuanceId": null,
        "category": NotificationCategory.TRANSACTION_CONFIRMED,
        "status": NotificationStatus.NEW,
        "message": "Your withdrawal request for 1000000000000000000 ETH was successful [####].",
        "title": "Withdrawal successful"
    }
  ];

  constructor() { }

  ngOnInit() {
  }

}

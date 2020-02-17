import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

import { NotificationModel, NotificationCategory, NotificationStatus } from './notification.model';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit {
  private notifications: NotificationModel[] = [
    {
      "notificationId": "5e4a523123b4294079e9f4a3",
      "userAddress": "0x2932516d9564cb799dda2c16559cad5b8357a0d6",
      "creationTimestamp": 1581929009082,
      "instrumentId": 2,
      "issuanceId": null,
      "category": NotificationCategory.TRANSACTION_INITIATED,
      "status": NotificationStatus.READ,
      "message": "Your deposit request for 1 ${tokenName} has been initiated [####].",
      "title": "Deposit request initiated"
  },
  {
      "notificationId": "5e4a524623b4294079e9f4a4",
      "userAddress": "0x2932516d9564cb799dda2c16559cad5b8357a0d6",
      "creationTimestamp": 1581929030855,
      "instrumentId": 2,
      "issuanceId": null,
      "category": NotificationCategory.TRANSACTION_CONFIRMED,
      "status": NotificationStatus.NEW,
      "message": "Your deposit request for 1000000000000000000 ETH was successful [####].",
      "title": "Deposited successful"
    }
  ];

  constructor(private location: Location) { }

  ngOnInit() {
  }

  navigateBack() {
    this.location.back();
  }

}

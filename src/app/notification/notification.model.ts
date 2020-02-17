export enum NotificationCategory {
  TRANSACTION_INITIATED = 1,
  TRANSACTION_CONFIRMED = 2,
}

export enum NotificationStatus {
  NEW = 1,
  READ = 2,
}

export class NotificationModel {
  constructor(public notificationId: string, public userAddress: string,
    public creationTimestamp: number, public instrumentId: number,
    public issuanceId: number, public category: NotificationCategory,
    public status: NotificationStatus, public title: string, public message: string) {}
}

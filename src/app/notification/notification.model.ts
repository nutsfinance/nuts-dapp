export enum NotificationCategory {
  TRANSACTION_INITIATED = 'TRANSACTION_INITIATED',
  TRANSACTION_CONFIRMED = 'TRANSACTION_CONFIRMED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  ASSETS = 'ASSETS',
  EXPIRATION = 'EXPIRATION',
  DUE = 'DUE',
}

export enum NotificationStatus {
  NEW = 'NEW',
  READ = 'READ',
}

export class NotificationModel {
  constructor(public notificationId: string, public userAddress: string,
    public creationTimestamp: number, public instrumentId: number,
    public issuanceId: number, public category: NotificationCategory,
    public status: NotificationStatus, public title: string, public message: string) {}
}

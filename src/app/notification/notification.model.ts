import { TransactionType } from './transaction.model';

export enum NotificationCategory {
  TRANSACTION_INITIATED = 0,
  TRANSACTION_CONFIRMED = 1,
  TRANSACTION_FAILED = 2,
  ASSETS = 3,
  EXPIRATION = 4,
  DUE = 5,
}

export enum NotificationReadStatus {
  NEW = 0,
  READ = 1,
}

export class NotificationModel {
  constructor(public notificationId: string, public userAddress: string,
    public transactionHash: string, public creationTimestamp: number,
    public instrumentId: number, public issuanceId: number,
    public category: NotificationCategory, public readStatus: NotificationReadStatus,
    public title: string, public message: string,
    public type: TransactionType, public metadata: {[key: string]: string}) {}
}

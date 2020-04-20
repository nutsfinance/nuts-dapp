import { TransactionType } from './transaction.model';

export enum NotificationCategory {
  TRANSACTION_INITIATED = 'TRANSACTION_INITIATED',
  TRANSACTION_CONFIRMED = 'TRANSACTION_CONFIRMED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  ASSETS = 'ASSETS',
  EXPIRATION = 'EXPIRATION',
  DUE = 'DUE',
}

export enum NotificationReadStatus {
  NEW = 'NEW',
  READ = 'READ',
}

export class NotificationModel {
  constructor(public notificationId: string, public userAddress: string,
    public transactionHash: string, public creationTimestamp: number,
    public instrumentId: number, public issuanceId: number,
    public category: NotificationCategory, public readStatus: NotificationReadStatus,
    public title: string, public message: string,
    public type: TransactionType, public metadata: {[key: string]: string}) {}
}

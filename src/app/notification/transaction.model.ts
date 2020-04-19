export enum TransactionType {
  APPROVE = 0,
  DEPOSIT = 1,
  WITHDRAW = 2,
  CREATE_OFFER = 3,
  CANCEL_OFFER = 4,
  ACCEPT_OFFER = 5,
  PAY_OFFER = 6,
}

export enum NotificationRole {
  TAKER = 'TAKER',
  MAKER = 'MAKER',
}

export class TransactionModel {
  constructor(public transactionHash: string, public type: TransactionType, public role: NotificationRole,
    public userAddress: string, public instrumentId: number, public issuanceId: number,
    public metadata: {[key: string]: string}) {}
}

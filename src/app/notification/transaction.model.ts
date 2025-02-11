export enum TransactionType {
  APPROVE = 'APPROVE',
  DEPOSIT = 'DEPOSIT',
  WITHDRAW = 'WITHDRAW',
  CREATE_OFFER = 'CREATE_OFFER',
  CANCEL_OFFER = 'CANCEL_OFFER',
  ACCEPT_OFFER = 'ACCEPT_OFFER',
  PAY_OFFER = 'PAY_OFFER',
}

export enum NotificationRole {
  TAKER = 'TAKER',
  MAKER = 'MAKER',
}

export class TransactionModel {
  constructor(public transactionHash: string, public type: TransactionType, public role: NotificationRole,
    public userAddress: string, public issuanceId: number, public metadata: {[key: string]: string}) {}
}
export enum TransactionType {
  APPROVE = 'APPROVE',
  DEPOSIT = 'DEPOSIT',
  WITHDRAW = 'WITHDRAW',
  CREATE_OFFER = 'CREATE_OFFER',
}

export class TransactionModel {
  constructor(public transactionHash: string, public type: TransactionType,
    public userAddress: string, public instrumentId: number,
    public metadata: {[key: string]: string}) {}
}

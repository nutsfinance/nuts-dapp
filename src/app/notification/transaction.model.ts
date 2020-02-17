export enum TransactionType {
  APPROVE = 'APPROVE',
  DEPOSIT = 'DEPOSIT',
  WITHDRAW = 'WITHDRAW',
}

export class TransactionModel {
  constructor(public transactionHash: string, public type: TransactionType,
    public userAddress: string, public instrumentId: number,
    public metadata: {[key: string]: string}) {}
}

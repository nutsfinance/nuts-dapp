export enum TransactionType {
  APPROVE = 1,
  DEPOSIT = 2,
  WITHDRAW = 3,
}

export class TransactionModel {
  constructor(public transactionHash: string, public type: TransactionType,
    public userAddress: string, public instrumentId: number,
    public metadata: {[key: string]: string}) {}
}

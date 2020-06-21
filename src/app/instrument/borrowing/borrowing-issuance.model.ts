export class BorrowingIssuanceModel {
    constructor(public borrowingtokenaddress: string, public collateraltokenaddress: string,
        public borrowingAmount: number, public collateralratio: number, public collateralamount: number,
        public interestrate: number, public interestamount: number, public tenordays: number) {}
}

export enum BorrowingEngagementState {
    LoanStateUnknown = 0,
    Unpaid = 1,
    Repaid = 2,
    Delinquent = 3,
}


export class BorrowingEngagementModel {
    constructor(public loanstate: BorrowingEngagementState) {}
}
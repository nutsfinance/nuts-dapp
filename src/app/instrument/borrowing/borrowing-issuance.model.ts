export class BorrowingIssuanceModel {
    constructor(public borrowingtokenaddress: string, public collateraltokenaddress: string,
        public borrowingamount: string, public collateralratio: number, public collateralamount: string,
        public interestrate: number, public interestamount: string, public tenordays: number) {}
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
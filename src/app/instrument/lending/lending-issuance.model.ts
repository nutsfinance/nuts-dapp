export class LendingIssuanceModel {
    constructor(public lendingtokenaddress: string, public collateraltokenaddress: string,
        public LendingAmount: number, public collateralratio: number, public collateralamount: number,
        public interestrate: number, public interestamount: number, public tenordays: number) {}
}

export enum LendingEngagementState {
    LoanStateUnknown = 0,
    Unpaid = 1,
    Repaid = 2,
    Delinquent = 3,
}


export class LendingEngagementModel {
    constructor(public loanstate: LendingEngagementState) {}
}
export class LendingIssuanceModel {
    constructor(public lendingtokenaddress: string, public collateraltokenaddress: string,
        public lendingamount: string, public collateralratio: number, public collateralamount: string,
        public interestrate: number, public interestamount: string, public tenordays: number) {}
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
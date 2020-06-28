export class LendingIssuanceModel {
    constructor(public lendingtokenaddress: string, public collateraltokenaddress: string,
        public lendingamount: string, public collateralratio: number, public collateralamount: string,
        public interestrate: string, public interestamount: string, public tenordays: string) {}
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
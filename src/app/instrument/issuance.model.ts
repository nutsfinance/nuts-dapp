export enum UserRole {
    Maker = 'maker',
    Taker = 'taker',
    Other = 'other',
}

export enum IssuanceState {
    Unknown = 0,
    Initiated = 1,
    Engageable = 2,
    Cancelled = 3,
    Complete = 4,
}

export enum EngagementState {
    Unknown = 0,
    Initiated = 1,
    Active = 2,
    Cancelled = 3,
    Complete = 4,
}

export class PayableModel {
    constructor(public payableid: number, public engagementid: number, public obligatoraddress: string,
        public claimoraddress: string, public tokenaddress: string, public amount: string,
        public payableduetimestamp: number) {}
}

export class EngagementModel {
    constructor(public engagementid: number, public takeraddress: string, public engagementcreationtimestamp: number,
        public engagementduetimestamp: number, public engagementcanceltimestamp: number, public engagementcompletetimestamp: number,
        public engagementstate: EngagementState, public engagementcustomproperty: any) {}

    getEngagementState(): string {
        return EngagementState[this.engagementstate];
    }
}

export class IssuanceModel {
    constructor(public issuanceid: number, public instrumentid, public makeraddress: string, public issuanceaddress: string,
        public issuanceescrowaddress: string, public issuancecreationtimestamp: number, public issuanceduetimestamp: number,
        public issuancecanceltimestamp: number, public issuancecompletetimestamp: number, public completionratio: number,
        public issuancestate: IssuanceState, public issuancecustomproperty: any,
        public engagements: EngagementModel[], public payables: PayableModel[]) { }

    getIssuancestate(): string {
        return IssuanceState[this.issuancestate];
    }
}
import { SupplementalLineItemModel } from './supplemental-line-item.model';

export enum IssuanceState {
    Unknown = 0,
    Initiated = 1,
    Engageable = 2,
    Engaged = 3,
    Unfunded = 4,
    Cancelled = 5,
    Expired = 6,
    Completed = 7,
    Delinquent = 8,
}

export class IssuanceModel {
    constructor(public issuanceId: number, public makerAddress: string, public takerAddress: string,
        public engagementDueTimestamp: number, public issuanceDueTimestamp: number, public creationTimestamp: number,
        public engagementTimestamp: number, public settlementTimestamp: number, public issuanceProxyAddress: string,
        public issuanceEscrowAddress: string, public state: IssuanceState,
        public supplementalLineItems: SupplementalLineItemModel[]) { }

    getIssuanceState(): string {
        return IssuanceState[this.state];
    }

    getUserRole(userAddress: string): string {
        if (this.makerAddress.toLowerCase() == userAddress.toLowerCase())   return 'maker';
        if (this.takerAddress.toLowerCase() == userAddress.toLowerCase())   return 'taker';

        return 'other';
    }
}
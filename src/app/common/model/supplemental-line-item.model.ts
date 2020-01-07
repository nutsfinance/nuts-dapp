import { SupplementalLineItem } from 'nuts-platform-protobuf-messages';

export enum SupplementalLineItemType {
    UnknownType = 0,
    Payable = 1,
};

export enum SupplementalLineItemState {
    UnknownState = 0,
    Unpaid = 1,
    Paid = 2,
    Reinitiated = 3,
};

export class SupplementalLineItemModel {
    constructor(public id: number, public type: SupplementalLineItemType, public state: SupplementalLineItemState,
        public obligatorAddress: string, public claimorAddress: string, public tokenAddress: string,
        public amount: number, public dueTimestamp: number, public reinitiatedTo: number) { }

    static fromMessage(supplementalLineItem: SupplementalLineItem): SupplementalLineItemModel {
        return new SupplementalLineItemModel(
            supplementalLineItem.getId().toNumber(),
            supplementalLineItem.getLineitemtype(),
            supplementalLineItem.getState(),
            supplementalLineItem.getObligatoraddress().toAddress(),
            supplementalLineItem.getClaimoraddress().toAddress(),
            supplementalLineItem.getTokenaddress().toAddress(),
            supplementalLineItem.getAmount().toNumber(),
            supplementalLineItem.getDuetimestamp().toNumber(),
            supplementalLineItem.getReinitiatedto().toNumber()
        );
    }
}
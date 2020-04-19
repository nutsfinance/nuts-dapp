import { SupplementalLineItemModel } from './supplemental-line-item.model';
import { IssuanceState, IssuanceModel } from './issuance.model';
import { BorrowingData } from 'nuts-platform-protobuf-messages';

export class BorrowingIssuanceModel extends IssuanceModel {
    constructor(public borrowingTokenAddress: string, public collateralTokenAddress: string, public borrowingAmount: number,
        public collateralRatio: number, public collateralAmount: number, public interestRate: number,
        public interestAmount: number, public tenorDays: number, issuanceId: number, makerAddress: string, takerAddress: string,
        engagementDueTimestamp: number, issuanceDueTimestamp: number, creationTimestamp: number,
        engagementTimestamp: number, settlementTimestamp: number, issuanceProxyAddress: string,
        issuanceEscrowAddress: string, state: IssuanceState, supplementalLineItems: SupplementalLineItemModel[]) {

        super(issuanceId, makerAddress, takerAddress, engagementDueTimestamp, issuanceDueTimestamp,
            creationTimestamp, engagementTimestamp, settlementTimestamp, issuanceProxyAddress, issuanceEscrowAddress,
            state, supplementalLineItems);
    }

    static fromMessage(borrowingCompleteProperties: BorrowingData.BorrowingCompleteProperties): BorrowingIssuanceModel {
        const borrowingProperties = borrowingCompleteProperties.getBorrowingproperties();
        const issuanceProperties = borrowingCompleteProperties.getIssuanceproperties();
        const supplementalLineItems: SupplementalLineItemModel[] = [];
        for (let item of issuanceProperties.getSupplementallineitemsList()) {
            supplementalLineItems.push(SupplementalLineItemModel.fromMessage(item));
        }
        return new BorrowingIssuanceModel(
            borrowingProperties.getBorrowingtokenaddress().toAddress(),
            borrowingProperties.getCollateraltokenaddress().toAddress(),
            borrowingProperties.getBorrowingamount().toNumber(),
            borrowingProperties.getCollateralratio().toNumber(),
            borrowingProperties.getCollateralamount().toNumber(),
            borrowingProperties.getInterestrate().toNumber(),
            borrowingProperties.getInterestamount().toNumber(),
            borrowingProperties.getTenordays().toNumber(),
            issuanceProperties.getIssuanceid().toNumber(),
            issuanceProperties.getMakeraddress().toAddress(),
            issuanceProperties.getTakeraddress().toAddress(),
            issuanceProperties.getEngagementduetimestamp().toNumber(),
            issuanceProperties.getIssuanceduetimestamp().toNumber(),
            issuanceProperties.getCreationtimestamp().toNumber(),
            issuanceProperties.getEngagementtimestamp().toNumber(),
            issuanceProperties.getSettlementtimestamp().toNumber(),
            issuanceProperties.getIssuanceproxyaddress().toAddress(),
            issuanceProperties.getIssuanceescrowaddress().toAddress(),
            issuanceProperties.getState(),
            supplementalLineItems
        );
    }

    static fromObject(borrowingCompleteProperties): BorrowingIssuanceModel {
        const borrowingProperties = borrowingCompleteProperties.borrowingproperties;
        const issuanceProperties = borrowingCompleteProperties.issuanceproperties;
        const supplementalLineItems: SupplementalLineItemModel[] = [];
        for (let item of issuanceProperties.supplementallineitems) {
            supplementalLineItems.push(SupplementalLineItemModel.fromObject(item));
        }
        return new BorrowingIssuanceModel(
            borrowingProperties.borrowingtokenaddress,
            borrowingProperties.collateraltokenaddress,
            borrowingProperties.borrowingamount,
            borrowingProperties.collateralratio,
            borrowingProperties.collateralamount,
            borrowingProperties.interestrate,
            borrowingProperties.interestamount,
            borrowingProperties.tenordays,
            issuanceProperties.issuanceid,
            issuanceProperties.makeraddress,
            issuanceProperties.takeraddress,
            issuanceProperties.engagementduetimestamp,
            issuanceProperties.issuanceduetimestamp,
            issuanceProperties.creationtimestamp,
            issuanceProperties.engagementtimestamp,
            issuanceProperties.settlementtimestamp,
            issuanceProperties.issuanceproxyaddress,
            issuanceProperties.issuanceescrowaddress,
            issuanceProperties.state,
            supplementalLineItems
        );
    }
}
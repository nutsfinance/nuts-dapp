import { SupplementalLineItemModel } from './supplemental-line-item.model';
import { IssuanceState, IssuanceModel } from './issuance.model';
import { LendingData } from 'nuts-platform-protobuf-messages';

export class LendingIssuanceModel extends IssuanceModel {
    constructor(public lendingTokenAddress: string, public collateralTokenAddress: string, public lendingAmount: number,
        public collateralRatio: number, public collateralAmount: number, public interestRate: number,
        public interestAmount: number, public tenorDays: number, issuanceId: number, makerAddress: string, takerAddress: string,
        engagementDueTimestamp: number, issuanceDueTimestamp: number, creationTimestamp: number,
        engagementTimestamp: number, settlementTimestamp: number, issuanceProxyAddress: string,
        issuanceEscrowAddress: string, state: IssuanceState, supplementalLineItems: SupplementalLineItemModel[]) {

        super(issuanceId, makerAddress, takerAddress, engagementDueTimestamp, issuanceDueTimestamp,
            creationTimestamp, engagementTimestamp, settlementTimestamp, issuanceProxyAddress, issuanceEscrowAddress,
            state, supplementalLineItems);
    }

    static fromMessage(lendingCompleteProperties: LendingData.LendingCompleteProperties): LendingIssuanceModel {
        const lendingProperties = lendingCompleteProperties.getLendingproperties();
        const issuanceProperties = lendingCompleteProperties.getIssuanceproperties();
        const supplementalLineItems: SupplementalLineItemModel[] = [];
        for (let item of issuanceProperties.getSupplementallineitemsList()) {
            supplementalLineItems.push(SupplementalLineItemModel.fromMessage(item));
        }
        return new LendingIssuanceModel(
            lendingProperties.getLendingtokenaddress().toAddress(),
            lendingProperties.getCollateraltokenaddress().toAddress(),
            lendingProperties.getLendingamount().toNumber(),
            lendingProperties.getCollateralratio().toNumber(),
            lendingProperties.getCollateralamount().toNumber(),
            lendingProperties.getInterestrate().toNumber(),
            lendingProperties.getInterestamount().toNumber(),
            lendingProperties.getTenordays().toNumber(),
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
}
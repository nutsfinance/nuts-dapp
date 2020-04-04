import { SupplementalLineItemModel } from './supplemental-line-item.model';
import { IssuanceState, IssuanceModel } from './issuance.model';
import { SwapData } from 'nuts-platform-protobuf-messages';

export class SwapIssuanceModel extends IssuanceModel {
    constructor(public inputTokenAddress: string, public outputTokenAddress: string, public inputAmount: number,
        public outputAmount: number, public duration: number, issuanceId: number, makerAddress: string,
        takerAddress: string, engagementDueTimestamp: number, issuanceDueTimestamp: number, creationTimestamp: number,
        engagementTimestamp: number, settlementTimestamp: number, issuanceProxyAddress: string,
        issuanceEscrowAddress: string, state: IssuanceState, supplementalLineItems: SupplementalLineItemModel[]) {

        super(issuanceId, makerAddress, takerAddress, engagementDueTimestamp, issuanceDueTimestamp,
            creationTimestamp, engagementTimestamp, settlementTimestamp, issuanceProxyAddress, issuanceEscrowAddress,
            state, supplementalLineItems);
    }

    static fromMessage(swapCompleteProperties: SwapData.SwapCompleteProperties): SwapIssuanceModel {
        const swapProperties = swapCompleteProperties.getSwapproperties();
        const issuanceProperties = swapCompleteProperties.getIssuanceproperties();
        const supplementalLineItems: SupplementalLineItemModel[] = [];
        for (let item of issuanceProperties.getSupplementallineitemsList()) {
            supplementalLineItems.push(SupplementalLineItemModel.fromMessage(item));
        }
        return new SwapIssuanceModel(
            swapProperties.getInputtokenaddress().toAddress(),
            swapProperties.getOutputtokenaddress().toAddress(),
            swapProperties.getInputamount().toNumber(),
            swapProperties.getOutputamount().toNumber(),
            swapProperties.getDuration().toNumber(),
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
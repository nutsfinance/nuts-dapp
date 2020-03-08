import { LendingData } from 'nuts-platform-protobuf-messages';

export class LendingMakerParameterModel {
    constructor(public collateralTokenAddress: string, public lendingTokenAddress: string,
        public lendingAmount: number, public collateralRatio: number, public tenorDays: number,
        public interestRate: number) {}

    static fromMessage(lendingMakerParameters: LendingData.LendingMakerParameters): LendingMakerParameterModel {
        return new LendingMakerParameterModel(
            lendingMakerParameters.getCollateraltokenaddress().toAddress(),
            lendingMakerParameters.getLendingtokenaddress().toAddress(),
            lendingMakerParameters.getLendingamount().toNumber(),
            lendingMakerParameters.getCollateralratio().toNumber(),
            lendingMakerParameters.getTenordays().toNumber(),
            lendingMakerParameters.getInterestrate().toNumber()
        );
    }

    toMessage(): LendingData.LendingMakerParameters {
        const lendingMakerParameters = new LendingData.LendingMakerParameters();
        lendingMakerParameters.setCollateraltokenaddress(LendingData.address.fromAddress(this.collateralTokenAddress.toLowerCase()));
        lendingMakerParameters.setLendingtokenaddress(LendingData.address.fromAddress(this.lendingTokenAddress.toLowerCase()));
        lendingMakerParameters.setLendingamount(LendingData.uint256.fromNumber(this.lendingAmount));
        lendingMakerParameters.setCollateralratio(LendingData.uint256.fromNumber(this.collateralRatio));
        lendingMakerParameters.setTenordays(LendingData.uint256.fromNumber(this.tenorDays));
        lendingMakerParameters.setInterestrate(LendingData.uint256.fromNumber(this.interestRate));

        return lendingMakerParameters;
    }
}
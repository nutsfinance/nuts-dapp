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
        lendingMakerParameters.setCollateraltokenaddress(this.collateralTokenAddress);
        lendingMakerParameters.setLendingtokenaddress(this.lendingTokenAddress);
        lendingMakerParameters.setLendingamount(this.lendingAmount);
        lendingMakerParameters.setCollateralratio(this.collateralRatio);
        lendingMakerParameters.setTenordays(this.tenorDays);
        lendingMakerParameters.setInterestrate(this.interestRate);
    }
}
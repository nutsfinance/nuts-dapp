import { BorrowingData } from 'nuts-platform-protobuf-messages';

export class BorrowingMakerParameterModel {
    constructor(public collateralTokenAddress: string, public borrowingTokenAddress: string,
        public borrowingAmount: number, public collateralRatio: number, public tenorDays: number,
        public interestRate: number) {}

    static fromMessage(borrowingMakerParameters: BorrowingData.BorrowingMakerParameters): BorrowingMakerParameterModel {
        return new BorrowingMakerParameterModel(
            borrowingMakerParameters.getCollateraltokenaddress().toAddress(),
            borrowingMakerParameters.getBorrowingtokenaddress().toAddress(),
            borrowingMakerParameters.getBorrowingamount().toNumber(),
            borrowingMakerParameters.getCollateralratio().toNumber(),
            borrowingMakerParameters.getTenordays().toNumber(),
            borrowingMakerParameters.getInterestrate().toNumber()
        );
    }

    toMessage(): BorrowingData.BorrowingMakerParameters {
        const borrowingMakerParameters = new BorrowingData.BorrowingMakerParameters();
        borrowingMakerParameters.setCollateraltokenaddress(BorrowingData.address.fromAddress(this.collateralTokenAddress.toLowerCase()));
        borrowingMakerParameters.setBorrowingtokenaddress(BorrowingData.address.fromAddress(this.borrowingTokenAddress.toLowerCase()));
        borrowingMakerParameters.setBorrowingamount(BorrowingData.uint256.fromNumber(this.borrowingAmount));
        borrowingMakerParameters.setCollateralratio(BorrowingData.uint256.fromNumber(this.collateralRatio));
        borrowingMakerParameters.setTenordays(BorrowingData.uint256.fromNumber(this.tenorDays));
        borrowingMakerParameters.setInterestrate(BorrowingData.uint256.fromNumber(this.interestRate));

        return borrowingMakerParameters;
    }
}
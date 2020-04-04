import { SwapData } from 'nuts-platform-protobuf-messages';

export class SwapMakerParameterModel {
    constructor(public inputTokenAddress: string, public outputTokenAddress: string,
        public inputAmount: number, public outputAmount: number, public duration: number) {}

    static fromMessage(swapMakerParameters: SwapData.SwapMakerParameters): SwapMakerParameterModel {
        return new SwapMakerParameterModel(
            swapMakerParameters.getInputtokenaddress().toAddress(),
            swapMakerParameters.getOutputtokenaddress().toAddress(),
            swapMakerParameters.getInputamount().toNumber(),
            swapMakerParameters.getOutputamount().toNumber(),
            swapMakerParameters.getDuration().toNumber()
        );
    }

    toMessage(): SwapData.SwapMakerParameters {
        const swapMakerParameters = new SwapData.SwapMakerParameters();
        swapMakerParameters.setInputtokenaddress(SwapData.address.fromAddress(this.inputTokenAddress.toLowerCase()));
        swapMakerParameters.setOutputtokenaddress(SwapData.address.fromAddress(this.outputTokenAddress.toLowerCase()));
        swapMakerParameters.setInputamount(SwapData.uint256.fromNumber(this.inputAmount));
        swapMakerParameters.setOutputamount(SwapData.uint256.fromNumber(this.outputAmount));
        swapMakerParameters.setDuration(SwapData.uint256.fromNumber(this.duration));

        return swapMakerParameters;
    }
}
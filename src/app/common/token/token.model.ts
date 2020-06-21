
/**
 * Model for ERC20 tokens.
 */
export class TokenModel {
    constructor(public tokenName: string, public tokenSymbol: string, public tokenAddress: string, public decimals: number,
        public iconUrl: string, public supportsTransaction: boolean) {}
}
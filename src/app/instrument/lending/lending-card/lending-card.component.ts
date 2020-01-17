import { Component, Input, OnInit, OnDestroy, NgZone } from '@angular/core';
import { LendingIssuanceModel } from 'src/app/common/model/lending-issuance.model';
import { NutsPlatformService } from 'src/app/common/web3/nuts-platform.service';
import { PriceOracleService } from 'src/app/common/web3/price-oracle.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-lending-card',
  templateUrl: './lending-card.component.html',
  styleUrls: ['./lending-card.component.scss']
})
export class LendingCardComponent implements OnInit, OnDestroy {
  @Input() private issuance: LendingIssuanceModel;
  private currentAccount: string;
  private lendingToken: string;
  private lendingValue: number;
  private collateralToken: string;
  private collateralValue: Promise<number>;

  private currentAccountSubscription: Subscription;


  constructor(private nutsPlatformService: NutsPlatformService, private priceOracleService: PriceOracleService,
    private zone: NgZone) { }

  ngOnInit() {
    this.currentAccount = this.nutsPlatformService.currentAccount;
    this.currentAccountSubscription = this.nutsPlatformService.currentAccountSubject.subscribe((account) => {
      this.zone.run(() => {
        this.currentAccount = account;
      });
    });
    this.lendingToken = this.nutsPlatformService.getTokenNameByAddress(this.issuance.lendingTokenAddress);
    this.lendingValue = this.nutsPlatformService.getTokenValueByAddress(this.issuance.lendingTokenAddress, this.issuance.lendingAmount);
    this.collateralToken = this.nutsPlatformService.getTokenNameByAddress(this.issuance.collateralTokenAddress);
    this.collateralValue = this.issuance.collateralAmount ? Promise.resolve(this.nutsPlatformService.getTokenValueByAddress(this.issuance.lendingTokenAddress, this.issuance.collateralAmount)) :
      this.getConvertedValue(this.issuance.collateralTokenAddress, this.issuance.lendingTokenAddress, this.lendingValue * this.issuance.collateralRatio / 10000);
  }

  ngOnDestroy() {
    this.currentAccountSubscription.unsubscribe();
  }

  async getConvertedValue(baseTokenAddress: string, quoteTokenAddress: string, baseTokenAmount: number) {
    console.log(baseTokenAddress, quoteTokenAddress, baseTokenAmount);
    const result = await this.priceOracleService.getPrice(baseTokenAddress, quoteTokenAddress);
    console.log(result);
    return baseTokenAmount * result[1] / result[0];
  }
}

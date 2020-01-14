import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { NutsPlatformService } from 'src/app/common/web3/nuts-platform.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { LendingIssuanceModel } from 'src/app/common/model/lending-issuance.model';

@Component({
  selector: 'app-lending-detail',
  templateUrl: './lending-detail.component.html',
  styleUrls: ['./lending-detail.component.scss']
})
export class LendingDetailComponent implements OnInit, OnDestroy {
  private issuanceId: number;
  private issuance: LendingIssuanceModel;
  private lendingToken: string;
  private lendingValue: number;
  private collateralToken: string;
  private collateralValue: number;
  private issuanceIdSubscription: Subscription;
  private lendingUpdatedSubscription: Subscription;

  constructor(private nutsPlatformService: NutsPlatformService, private route: ActivatedRoute,
    private zone: NgZone) { }

  ngOnInit() {
    this.issuanceId = this.route.snapshot.params['id'];
    this.updateLendingIssuance();
    this.issuanceIdSubscription = this.route.params.subscribe((params) => {
      this.issuanceId = +params['id'];
      this.updateLendingIssuance();
    });
    this.lendingUpdatedSubscription = this.nutsPlatformService.lendingIssuancesUpdatedSubject.subscribe(_ => {
      this.updateLendingIssuance();
    });
  }

  ngOnDestroy() {
    this.issuanceIdSubscription.unsubscribe();
    this.lendingUpdatedSubscription.unsubscribe();
  }

  private updateLendingIssuance() {
    this.zone.run(() => {
      this.issuance = this.nutsPlatformService.getLendingIssuance(this.issuanceId);
      console.log(this.issuance);
      if (this.issuance) {
        this.lendingToken = this.nutsPlatformService.getTokenNameByAddress(this.issuance.lendingTokenAddress);
        this.lendingValue = this.nutsPlatformService.getTokenValueByAddress(this.issuance.lendingTokenAddress, this.issuance.lendingAmount);
        this.collateralToken = this.nutsPlatformService.getTokenNameByAddress(this.issuance.collateralTokenAddress);
        this.collateralValue = this.nutsPlatformService.getTokenValueByAddress(this.issuance.collateralTokenAddress, this.issuance.collateralAmount);
      }
    });
  }
}

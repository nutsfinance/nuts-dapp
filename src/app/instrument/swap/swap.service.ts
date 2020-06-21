import { Injectable } from "@angular/core";
import { InstrumentService } from '../instrument.service';
import { IssuanceModel } from '../issuance.model';
import { Subject } from 'rxjs';
import { NutsPlatformService, SWAP_NAME } from 'src/app/common/web3/nuts-platform.service';
import { NotificationService } from 'src/app/notification/notification.service';
import { TokenService } from 'src/app/common/token/token.service';
import { HttpClient } from '@angular/common/http';
import * as isEqual from 'lodash.isequal';

@Injectable({
    providedIn: 'root'
})
export class SwapService extends InstrumentService {
    public swapIssuances: IssuanceModel[] = [];
    public swapIssuancesUpdated: Subject<IssuanceModel[]> = new Subject();

    constructor(nutsPlatformService: NutsPlatformService, notificationService: NotificationService,
        tokenService: TokenService, http: HttpClient) {
        super(nutsPlatformService, notificationService, tokenService, http);

        this.reloadSwapIssuances();
        this.nutsPlatformService.platformInitializedSubject.subscribe(initialized => {
            if (!initialized) return;
            console.log('Platform initialized. Reloading swap issuances.');
            this.reloadSwapIssuances();
        });
        this.nutsPlatformService.currentNetworkSubject.subscribe(currentNetwork => {
            console.log('Network changed. Reloading swap issuances.', currentNetwork);
            this.reloadSwapIssuances();
        });

        // Reloads issuances every 30s.
        setInterval(this.reloadSwapIssuances.bind(this), 30000);
    }

    public async reloadSwapIssuances(times: number = 1, interval: number = 1000) {
        const instrumentId = this.nutsPlatformService.getInstrumentId(SWAP_NAME);
        let count = 0;
        let intervalId = setInterval(() => {
            this.getIssuances(instrumentId).subscribe(swapIssuances => {
                // Update the swap issuance list if there is a change
                if (!isEqual(swapIssuances, this.swapIssuances)) {
                    console.log('Swap issuance list updated.');
                    this.swapIssuances = swapIssuances;
                    this.swapIssuancesUpdated.next(this.swapIssuances);

                    // We could stop prematurally once we get an update!
                    clearInterval(intervalId);
                }
            });
            if (++count >= times) clearInterval(intervalId);
        }, interval);
    }
}
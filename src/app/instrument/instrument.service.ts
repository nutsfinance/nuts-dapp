import {  NutsPlatformService } from '../common/web3/nuts-platform.service';
import { NotificationService } from 'src/app/notification/notification.service';
import { TokenService } from '../common/token/token.service';
import { HttpClient } from '@angular/common/http';
import { IssuanceModel } from './issuance.model';

/**
 * Base class for instrument services.
 */
export class InstrumentService {
  constructor(protected nutsPlatformService: NutsPlatformService, protected notificationService: NotificationService,
    protected tokenService: TokenService, protected http: HttpClient) {}

  protected getIssuances(instrumentId: number) {
    return this.http.get<IssuanceModel[]>(`${this.nutsPlatformService.getApiServerHost()}/instruments/${instrumentId}/issuances`);
  }
}

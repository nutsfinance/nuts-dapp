import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { IssuanceModel } from '../issuance.model';
import { LendingService } from './lending.service';

@Injectable({ providedIn: 'root' })
export class LendingResolver implements Resolve<IssuanceModel> {
  constructor(private lendingService: LendingService) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any>|Promise<any>|any {
    return this.lendingService.getLendingIssuances().pipe(take(1));
  }
}
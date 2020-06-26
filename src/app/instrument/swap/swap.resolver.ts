import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { IssuanceModel } from '../issuance.model';
import { SwapService } from './swap.service';

@Injectable({ providedIn: 'root' })
export class SwapResolver implements Resolve<IssuanceModel> {
  constructor(private swapService: SwapService) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any>|Promise<any>|any {
    return this.swapService.getSwapIssuances().pipe(take(1));
  }
}
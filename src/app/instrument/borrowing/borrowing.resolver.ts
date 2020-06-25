import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { IssuanceModel } from '../issuance.model';
import { BorrowingService } from './borrowing.service';

@Injectable({ providedIn: 'root' })
export class BorrowingResolver implements Resolve<IssuanceModel> {
  constructor(private borrowingService: BorrowingService) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any>|Promise<any>|any {
    return this.borrowingService.getBorrowingIssuances().pipe(take(1));
  }
}
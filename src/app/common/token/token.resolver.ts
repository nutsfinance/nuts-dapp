import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { TokenModel } from './token.model';
import { TokenService } from './token.service';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class TokenResolver implements Resolve<TokenModel> {
  constructor(private tokenService: TokenService) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any>|Promise<any>|any {
    return this.tokenService.getTokens().pipe(take(1));
  }
}
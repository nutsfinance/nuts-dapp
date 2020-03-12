import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, CanActivateChild } from '@angular/router';
import { Observable, zip } from 'rxjs';
import { map } from 'rxjs/operators';
import { NutsPlatformService } from '../common/web3/nuts-platform.service';

@Injectable()
export class CanActivateInstrument implements CanActivateChild {
    constructor(private nutsPlatformService: NutsPlatformService) {}

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        if (!!this.nutsPlatformService.currentAccount && !!this.nutsPlatformService.currentNetwork) {
            return true;
        }
        return zip(this.nutsPlatformService.currentAccountSubject, this.nutsPlatformService.currentNetworkSubject)
            .pipe(
                map(([currentAccount, currentNetwork]) => {
                    console.log(currentAccount, currentNetwork);
                    return !!currentAccount && !!currentNetwork;
                })
            );
    }
}
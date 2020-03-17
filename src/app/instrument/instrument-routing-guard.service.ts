import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, CanActivateChild } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NutsPlatformService } from '../common/web3/nuts-platform.service';

@Injectable()
export class CanActivateInstrument implements CanActivateChild {
    constructor(private nutsPlatformService: NutsPlatformService) {}

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        // Check whether both account and network are both set.
        if (!!this.nutsPlatformService.currentAccount && !!this.nutsPlatformService.currentNetwork) {
            return this.nutsPlatformService.isFullyLoaded();
        }
        return this.nutsPlatformService.platformInitializedSubject
            .pipe(
                map(_ => {
                    return this.nutsPlatformService.isFullyLoaded();
                })
            );
    }
}
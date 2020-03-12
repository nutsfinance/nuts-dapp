import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, CanActivateChild } from '@angular/router';
import { Observable, zip } from 'rxjs';
import { map } from 'rxjs/operators';
import { NutsPlatformService } from '../common/web3/nuts-platform.service';

@Injectable()
export class CanActivateInstrument implements CanActivateChild {
    constructor(private nutsPlatformService: NutsPlatformService) {}

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        // Check whether both account and network are both set.
        if (!!this.nutsPlatformService.currentAccount && !!this.nutsPlatformService.currentNetwork) {
            return this.canNavigate(this.nutsPlatformService.currentAccount, this.nutsPlatformService.currentNetwork);
        }
        return zip(this.nutsPlatformService.currentAccountSubject, this.nutsPlatformService.currentNetworkSubject)
            .pipe(
                map(([currentAccount, currentNetwork]) => {
                    return this.canNavigate(currentAccount, currentNetwork);
                })
            );
    }

    private canNavigate(currentAccount: string, currentNetwork: number) {
        console.log(currentAccount, currentNetwork);
        // We only support Main and Rinkeby now!
        return !!currentAccount && (currentNetwork == 1 || currentNetwork == 4);
    }
}
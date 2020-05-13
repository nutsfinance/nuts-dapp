import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  public language: string = 'en';
  public languageSubject = new BehaviorSubject(this.language);

  constructor(private router: Router, private route: ActivatedRoute) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.language = this.route.snapshot.firstChild.params.lang || 'en';
        this.languageSubject.next(this.language);
      }
    })
  }
}

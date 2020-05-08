import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  public language: string = 'en';

  constructor(private route: ActivatedRoute) { 
    this.route.params.subscribe(params => {
      this.language = params['lang'] || 'en';
    });
  }
}

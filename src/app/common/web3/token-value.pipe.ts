import { Pipe, PipeTransform } from '@angular/core';
import { NutsPlatformService } from './nuts-platform.service';

@Pipe({
  name: 'tokenValue'
})
export class TokenValuePipe implements PipeTransform {

  constructor(private nutsPlatformService: NutsPlatformService){}

  transform(value: any, ...args: any[]): any {
    console.log(value, args);
    if (!value) return 0;
    return this.nutsPlatformService.getTokenValueByName(args[0], value);
  }
}

import { Pipe, PipeTransform } from '@angular/core';
import { TokenService } from './token.service';

@Pipe({
  name: 'tokenValue'
})
export class TokenValuePipe implements PipeTransform {

  constructor(private tokenService: TokenService){}

  transform(value: any, ...args: any[]): any {
    if (!value) return 0;
    const token = this.tokenService.getTokenByAddress(args[0]);
    if (!token) return value;
    return this.tokenService.getDisplayValue(token.tokenAddress, value);
  }
}

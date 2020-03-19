import { TestBed } from '@angular/core/testing';

import { AccountBalanceService } from './account-balance.service';

describe('AccountBalanceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: AccountBalanceService = TestBed.get(AccountBalanceService);
    expect(service).toBeTruthy();
  });
});

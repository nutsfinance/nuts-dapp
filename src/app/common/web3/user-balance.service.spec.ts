import { TestBed } from '@angular/core/testing';

import { UserBalanceService } from './user-balance.service';

describe('UserBalanceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: UserBalanceService = TestBed.get(UserBalanceService);
    expect(service).toBeTruthy();
  });
});

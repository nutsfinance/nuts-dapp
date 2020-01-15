import { TestBed } from '@angular/core/testing';

import { PriceOracleService } from './price-oracle.service';

describe('PriceOracleService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PriceOracleService = TestBed.get(PriceOracleService);
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { InstrumentEscrowService } from './instrument-escrow.service';

describe('InstrumentEscrowService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: InstrumentEscrowService = TestBed.get(InstrumentEscrowService);
    expect(service).toBeTruthy();
  });
});

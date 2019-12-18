import { TestBed } from '@angular/core/testing';

import { NutsPlatformService } from './nuts-platform.service';

describe('NutsPlatformService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: NutsPlatformService = TestBed.get(NutsPlatformService);
    expect(service).toBeTruthy();
  });
});

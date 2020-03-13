import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InstrumentBalanceComponent } from './instrument-balance.component';

describe('InstrumentBalanceComponent', () => {
  let component: InstrumentBalanceComponent;
  let fixture: ComponentFixture<InstrumentBalanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InstrumentBalanceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InstrumentBalanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

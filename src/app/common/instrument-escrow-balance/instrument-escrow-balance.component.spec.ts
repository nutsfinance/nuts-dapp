import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InstrumentEscrowBalanceComponent } from './instrument-escrow-balance.component';

describe('InstrumentEscrowBalanceComponent', () => {
  let component: InstrumentEscrowBalanceComponent;
  let fixture: ComponentFixture<InstrumentEscrowBalanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InstrumentEscrowBalanceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InstrumentEscrowBalanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardMiningBalanceComponent } from './dashboard-mining-balance.component';

describe('DashboardMiningBalanceComponent', () => {
  let component: DashboardMiningBalanceComponent;
  let fixture: ComponentFixture<DashboardMiningBalanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DashboardMiningBalanceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardMiningBalanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

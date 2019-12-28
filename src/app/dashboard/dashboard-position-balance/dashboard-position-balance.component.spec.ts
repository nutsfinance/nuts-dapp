import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardPositionBalanceComponent } from './dashboard-position-balance.component';

describe('DashboardPositionBalanceComponent', () => {
  let component: DashboardPositionBalanceComponent;
  let fixture: ComponentFixture<DashboardPositionBalanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DashboardPositionBalanceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardPositionBalanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

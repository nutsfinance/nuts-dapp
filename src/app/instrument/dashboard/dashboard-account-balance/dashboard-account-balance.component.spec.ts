import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardAccountBalanceComponent } from './dashboard-account-balance.component';

describe('DashboardAccountBalanceComponent', () => {
  let component: DashboardAccountBalanceComponent;
  let fixture: ComponentFixture<DashboardAccountBalanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DashboardAccountBalanceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardAccountBalanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

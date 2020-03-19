import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountTotalBalanceComponent } from './account-total-balance.component';

describe('AccountTotalBalanceComponent', () => {
  let component: AccountTotalBalanceComponent;
  let fixture: ComponentFixture<AccountTotalBalanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AccountTotalBalanceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AccountTotalBalanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

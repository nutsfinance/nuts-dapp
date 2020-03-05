import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionNotificationComponent } from './transaction-notification.component';

describe('TransactionNotificationComponent', () => {
  let component: TransactionNotificationComponent;
  let fixture: ComponentFixture<TransactionNotificationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TransactionNotificationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TransactionNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

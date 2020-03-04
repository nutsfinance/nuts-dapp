import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionInitiatedDialogComponent } from './transaction-initiated-dialog.component';

describe('TransactionInitiatedDialogComponent', () => {
  let component: TransactionInitiatedDialogComponent;
  let fixture: ComponentFixture<TransactionInitiatedDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TransactionInitiatedDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TransactionInitiatedDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

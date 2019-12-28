import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BorrowingEngageComponent } from './borrowing-engage.component';

describe('BorrowingEngageComponent', () => {
  let component: BorrowingEngageComponent;
  let fixture: ComponentFixture<BorrowingEngageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BorrowingEngageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BorrowingEngageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

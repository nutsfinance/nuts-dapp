import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BorrowingCardComponent } from './borrowing-card.component';

describe('BorrowingCardComponent', () => {
  let component: BorrowingCardComponent;
  let fixture: ComponentFixture<BorrowingCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BorrowingCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BorrowingCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BorrowingPositionsComponent } from './borrowing-positions.component';

describe('BorrowingPositionsComponent', () => {
  let component: BorrowingPositionsComponent;
  let fixture: ComponentFixture<BorrowingPositionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BorrowingPositionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BorrowingPositionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

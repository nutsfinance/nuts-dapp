import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BorrowingCreateComponent } from './borrowing-create.component';

describe('BorrowingCreateComponent', () => {
  let component: BorrowingCreateComponent;
  let fixture: ComponentFixture<BorrowingCreateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BorrowingCreateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BorrowingCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

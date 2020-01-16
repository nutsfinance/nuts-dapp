import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LendingCardComponent } from './lending-card.component';

describe('LendingCardComponent', () => {
  let component: LendingCardComponent;
  let fixture: ComponentFixture<LendingCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LendingCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LendingCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

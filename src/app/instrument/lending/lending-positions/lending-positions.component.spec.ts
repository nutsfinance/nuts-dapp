import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LendingPositionsComponent } from './lending-positions.component';

describe('LendingPositionsComponent', () => {
  let component: LendingPositionsComponent;
  let fixture: ComponentFixture<LendingPositionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LendingPositionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LendingPositionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

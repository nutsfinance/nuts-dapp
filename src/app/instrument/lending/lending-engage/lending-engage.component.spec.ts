import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LendingEngageComponent } from './lending-engage.component';

describe('LendingEngageComponent', () => {
  let component: LendingEngageComponent;
  let fixture: ComponentFixture<LendingEngageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LendingEngageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LendingEngageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

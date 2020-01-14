import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LendingDetailComponent } from './lending-detail.component';

describe('LendingDetailComponent', () => {
  let component: LendingDetailComponent;
  let fixture: ComponentFixture<LendingDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LendingDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LendingDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

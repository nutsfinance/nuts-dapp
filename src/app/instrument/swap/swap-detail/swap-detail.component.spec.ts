import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SwapDetailComponent } from './swap-detail.component';

describe('SwapDetailComponent', () => {
  let component: SwapDetailComponent;
  let fixture: ComponentFixture<SwapDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SwapDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwapDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SwapEngageComponent } from './swap-engage.component';

describe('SwapEngageComponent', () => {
  let component: SwapEngageComponent;
  let fixture: ComponentFixture<SwapEngageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SwapEngageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwapEngageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

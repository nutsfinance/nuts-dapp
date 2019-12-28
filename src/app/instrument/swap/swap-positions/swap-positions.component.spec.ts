import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SwapPositionsComponent } from './swap-positions.component';

describe('SwapPositionsComponent', () => {
  let component: SwapPositionsComponent;
  let fixture: ComponentFixture<SwapPositionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SwapPositionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwapPositionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

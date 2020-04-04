import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SwapCardComponent } from './swap-card.component';

describe('SwapCardComponent', () => {
  let component: SwapCardComponent;
  let fixture: ComponentFixture<SwapCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SwapCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwapCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SwapCreateComponent } from './swap-create.component';

describe('SwapCreateComponent', () => {
  let component: SwapCreateComponent;
  let fixture: ComponentFixture<SwapCreateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SwapCreateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwapCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

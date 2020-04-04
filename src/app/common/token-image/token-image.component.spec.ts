import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TokenImageComponent } from './token-image.component';

describe('TokenImageComponent', () => {
  let component: TokenImageComponent;
  let fixture: ComponentFixture<TokenImageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TokenImageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TokenImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

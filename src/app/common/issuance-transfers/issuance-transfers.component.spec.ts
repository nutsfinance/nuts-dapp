import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IssuanceTransfersComponent } from './issuance-transfers.component';

describe('IssuanceTransfersComponent', () => {
  let component: IssuanceTransfersComponent;
  let fixture: ComponentFixture<IssuanceTransfersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IssuanceTransfersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IssuanceTransfersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

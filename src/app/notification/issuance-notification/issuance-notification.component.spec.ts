import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IssuanceNotificationComponent } from './issuance-notification.component';

describe('IssuanceNotificationComponent', () => {
  let component: IssuanceNotificationComponent;
  let fixture: ComponentFixture<IssuanceNotificationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IssuanceNotificationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IssuanceNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

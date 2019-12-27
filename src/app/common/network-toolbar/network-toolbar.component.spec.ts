import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkToolbarComponent } from './network-toolbar.component';

describe('NetworkToolbarComponent', () => {
  let component: NetworkToolbarComponent;
  let fixture: ComponentFixture<NetworkToolbarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NetworkToolbarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

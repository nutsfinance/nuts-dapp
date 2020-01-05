import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockTimestampComponent } from './block-timestamp.component';

describe('BlockTimestampComponent', () => {
  let component: BlockTimestampComponent;
  let fixture: ComponentFixture<BlockTimestampComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BlockTimestampComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BlockTimestampComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

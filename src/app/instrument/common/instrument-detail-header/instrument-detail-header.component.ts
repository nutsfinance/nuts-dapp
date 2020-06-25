import { Component, OnInit, Input } from '@angular/core';
import { IssuanceModel } from '../../issuance.model';
import { InstrumentService } from '../../instrument.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-instrument-detail-header',
  templateUrl: './instrument-detail-header.component.html',
  styleUrls: ['./instrument-detail-header.component.scss']
})
export class InstrumentDetailHeaderComponent implements OnInit {
  @Input() issuance: IssuanceModel;

  constructor(public instrumentService: InstrumentService, private location: Location) { }

  ngOnInit() {
  }

  navigateBack() {
    this.location.back();
  }

}

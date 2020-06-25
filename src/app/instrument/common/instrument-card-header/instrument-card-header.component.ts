import { Component, OnInit, Input } from '@angular/core';
import { IssuanceModel, UserRole } from '../../issuance.model';
import { NutsPlatformService } from 'src/app/common/web3/nuts-platform.service';
import { InstrumentService } from '../../instrument.service';

@Component({
  selector: 'app-instrument-card-header',
  templateUrl: './instrument-card-header.component.html',
  styleUrls: ['./instrument-card-header.component.scss']
})
export class InstrumentCardHeaderComponent implements OnInit {
  @Input() instrumentName: string;
  @Input() issuance: IssuanceModel;
  @Input() tenor: number;

  public issuanceId;
  public role: UserRole;

  constructor(private nutsPlatformService: NutsPlatformService, private instrumentService: InstrumentService) { }

  ngOnInit() {
    this.issuanceId = `${this.nutsPlatformService.getInstrumentId(this.instrumentName)}-${this.issuance.issuanceid}`;
    this.role = this.instrumentService.getUserRole(this.issuance);
  }

}

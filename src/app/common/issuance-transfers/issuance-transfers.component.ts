import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { IssuanceModel } from '../model/issuance.model';
import { InstrumentService, IssuanceTransfer } from '../web3/instrument.service';

@Component({
  selector: 'app-issuance-transfers',
  templateUrl: './issuance-transfers.component.html',
  styleUrls: ['./issuance-transfers.component.scss']
})
export class IssuanceTransfersComponent implements OnInit, OnChanges {
  @Input() instrument: string;
  @Input() issuance: IssuanceModel;

  public columns: string[] = ['action', 'from', 'to', 'amount', 'date'];
  public transfers: IssuanceTransfer[] = [];

  constructor(private instrumentService: InstrumentService) { }

  ngOnInit() {
  }

  ngOnChanges() {
    if (this.issuance) {
      // Retrieve issuance transfers
      this.instrumentService.getIssuanceTransfers(this.instrument, this.issuance).then((transfers) => {
        console.log('Transfers', transfers);
        this.transfers = transfers;
      });
    }
  }
}

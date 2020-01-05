import { Component, OnInit, Input, NgZone } from '@angular/core';

import { NutsPlatformService } from '../web3/nuts-platform.service';

@Component({
  selector: 'app-block-timestamp',
  templateUrl: './block-timestamp.component.html',
  styleUrls: ['./block-timestamp.component.scss']
})
export class BlockTimestampComponent implements OnInit {
  @Input() private blockNumber: string;
  private blockDate = '';

  constructor(private nutsPlatformService: NutsPlatformService, private zone: NgZone) { }

  async ngOnInit() {
    const blockTimestamp = await this.nutsPlatformService.getBlockTimestamp(this.blockNumber);
    this.zone.run(() => {
      const date = new Date(blockTimestamp * 1000);
      this.blockDate = ("0" + (date.getUTCMonth()+1)).slice(-2) + "-" + ("0" + date.getUTCDate()).slice(-2) + "-" +
        date.getUTCFullYear();
    });
  }

}

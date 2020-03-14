import { Component, OnInit, Input, NgZone } from '@angular/core';

import { NutsPlatformService } from '../web3/nuts-platform.service';

@Component({
  selector: 'app-block-timestamp',
  templateUrl: './block-timestamp.component.html',
  styleUrls: ['./block-timestamp.component.scss']
})
export class BlockTimestampComponent implements OnInit {
  @Input() private blockNumber: string;
  @Input() private showTimestamp = false;
  @Input() private align = 'left';
  private blockDate = '';
  private blockTimestamp 

  constructor(private nutsPlatformService: NutsPlatformService, private zone: NgZone) { }

  async ngOnInit() {
    const blockTimestamp = await this.nutsPlatformService.getBlockTimestamp(this.blockNumber);
    this.zone.run(() => {
      const date = new Date(blockTimestamp * 1000);
      this.blockDate = ("0" + (date.getUTCMonth()+1)).slice(-2) + "-" + ("0" + date.getUTCDate()).slice(-2) + "-"
        + date.getUTCFullYear();
      this.blockTimestamp = ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2) + ":"
        + ("0" + date.getSeconds()).slice(-2);
    });
  }

}

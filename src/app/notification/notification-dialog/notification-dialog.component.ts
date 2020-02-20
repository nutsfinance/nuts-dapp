import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { NotificationModel } from '../notification.model';
import { NutsPlatformService } from 'src/app/common/web3/nuts-platform.service';

@Component({
  selector: 'app-notification-dialog',
  templateUrl: './notification-dialog.component.html',
  styleUrls: ['./notification-dialog.component.scss']
})
export class NotificationDialog implements OnInit {

  constructor(public dialogRef: MatDialogRef<NotificationDialog>,
    @Inject(MAT_DIALOG_DATA) public notifications: NotificationModel[],
    private nutsPlatformService: NutsPlatformService) { }

  ngOnInit() {
  }

  closeDialog() {
    console.log('Closing');
    this.dialogRef.close();
    console.log('Should close');
  }

  getEtherscanLink(transactionHash: string): string {
    switch(this.nutsPlatformService.currentNetwork) {
      case 1:
        return `https://etherscan.io/tx/${transactionHash}`;
      case 3:
        return `https://ropsten.etherscan.io/tx/${transactionHash}`;
      case 4:
        return `https://rinkeby.etherscan.io/tx/${transactionHash}`;
      case 42:
        return `https://kovan.etherscan.io/tx/${transactionHash}`;
      default:
        return '';
    }
  }

  getTransactionShortHash(transactionHash: string): string {
    return `[${transactionHash.slice(0, 5)}...${transactionHash.slice(transactionHash.length - 4)}]`;
  }
}

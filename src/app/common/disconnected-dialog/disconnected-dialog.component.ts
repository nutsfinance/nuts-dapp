import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { NutsPlatformService } from '../web3/nuts-platform.service';

@Component({
    selector: 'app-disconnected-dialog',
    templateUrl: './disconnected-dialog.component.html',
    styleUrls: ['./disconnected-dialog.component.scss']
  })
  export class DisconnectedDialog implements OnInit {
  
    constructor(public dialogRef: MatDialogRef<DisconnectedDialog>, private nutsPlatformService: NutsPlatformService) { }
  
    ngOnInit() {
    }
  
    connectWallet() {
      this.dialogRef.close();
      this.nutsPlatformService.connectToEthereum();
    }
  }
  
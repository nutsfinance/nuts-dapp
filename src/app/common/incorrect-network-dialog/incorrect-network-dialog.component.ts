import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { NutsPlatformService } from '../web3/nuts-platform.service';

@Component({
    selector: 'app-incorrect-network-dialog',
    templateUrl: './incorrect-network-dialog.component.html',
    styleUrls: ['./incorrect-network-dialog.component.scss']
  })
  export class IncorrectNetworkDialog implements OnInit {
  
    constructor(public dialogRef: MatDialogRef<IncorrectNetworkDialog>, public nutsPlatformService: NutsPlatformService) { }
  
    ngOnInit() {
    }
  
  }
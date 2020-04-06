import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

export interface TransactionData {
  type: string,
  instrument: string,
  fspName?: string,
  tokenName?: string,
  tokenAmount?: number,
  issuanceId?: string,
}

@Component({
  selector: 'app-transaction-initiated-dialog',
  templateUrl: './transaction-initiated-dialog.component.html',
  styleUrls: ['./transaction-initiated-dialog.component.scss']
})
export class TransactionInitiatedDialog implements OnInit {

  constructor(public dialogRef: MatDialogRef<TransactionInitiatedDialog>,
    @Inject(MAT_DIALOG_DATA) public data: TransactionData) { }

  ngOnInit() {
  }

}

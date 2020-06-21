import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { TokenModel } from '../token/token.model';

export interface TransactionData {
  type: string,
  instrument: string,
  fspName?: string,
  companyName?: string,
  token?: TokenModel,
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

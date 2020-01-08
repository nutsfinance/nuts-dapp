import { DataSource } from '@angular/cdk/table';
import { BehaviorSubject } from 'rxjs';
import { LendingIssuanceModel } from '../../common/model/lending-issuance.model';

export class LendingIssuanceDataSource implements DataSource<any> {

    private lendingIssuanceSubject = new BehaviorSubject<any>([]);
  
    setData(lendingIssuances: LendingIssuanceModel[]) {
      const splittedData = [];
      lendingIssuances.forEach(issuance => {
        splittedData.push(issuance);
        splittedData.push({ issuanceId: issuance.issuanceId, action: true });
      });
  
      this.lendingIssuanceSubject.next(splittedData);
    }
  
    connect() {
      return this.lendingIssuanceSubject;
    }
  
    disconnect() { }
  }
  
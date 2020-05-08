import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';

import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';

import { Subscription } from 'rxjs';

import { LanguageService } from '../common/web3/language.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationReadStatus, NotificationModel } from '../notification/notification.model';
import { NotificationDialog } from '../notification/notification-dialog/notification-dialog.component';

@Component({
  selector: 'app-instrument',
  templateUrl: './instrument.component.html',
  styleUrls: ['./instrument.component.scss']
})
export class InstrumentComponent implements OnInit, OnDestroy {
  public language: string = 'English';
  public unreadNotifications: NotificationModel[] = [];

  private notificationSubscription: Subscription;

  constructor(public languageService: LanguageService, private _bottomSheet: MatBottomSheet, private dialog: MatDialog,
    private zone: NgZone, private notificationService: NotificationService) { }

  ngOnInit() {
    this.notificationSubscription = this.notificationService.notificationUpdatedSubject.subscribe(notifications => {
      this.zone.run(() => {
        this.unreadNotifications = notifications
          .filter(notification => notification.readStatus === NotificationReadStatus.NEW)
          .sort((n1, n2) => n2.creationTimestamp - n1.creationTimestamp);
      });
    });
  }

  ngOnDestroy() {
    this.notificationSubscription.unsubscribe();
  }

  openLanguageBottomSheet(): void {
    this._bottomSheet.open(LanguageSelectSheet);

    const bottomSheetRef = this._bottomSheet.open(LanguageSelectSheet);
    bottomSheetRef.afterDismissed().subscribe(language => {
      // Ignore if the bottom sheet is closed by clicking empty spaces.
      if (language) {
        console.log(language);
        this.language = language;
      }
    });
  }

  openNotificationDialog() {
    this.dialog.open(NotificationDialog, {
      width: '85%',
      maxWidth: '85%',
      data: this.unreadNotifications,
      position: {
        top: '100px'
      }
    });
  }
}

@Component({
  selector: 'app-language-select-sheet',
  templateUrl: './language-select-sheet.html'
})
export class LanguageSelectSheet {

  constructor(private _bottomSheetRef: MatBottomSheetRef<InstrumentComponent>) { }

  selectLanguage(language: string): void {
    console.log(language);
    this._bottomSheetRef.dismiss(language);
    event.preventDefault();
  }

}
import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-token-image',
  templateUrl: './token-image.component.html',
  styleUrls: ['./token-image.component.scss']
})
export class TokenImageComponent implements OnInit {
  @Input() token = 'ETH';

  constructor() { }

  ngOnInit() {
  }

}

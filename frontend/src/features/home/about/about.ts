import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [],
  templateUrl: './about.html',
  styleUrls: ['./about.scss']
})
export class About {
  @Input() aboutTitle: string | null = null;
  @Input() aboutBody: string | null = null;
  @Input() aboutImage: string | null = null;
}
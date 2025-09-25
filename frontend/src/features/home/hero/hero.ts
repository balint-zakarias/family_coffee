import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'section-hero',
  standalone: true,
  imports: [RouterLink],
  templateUrl: 'hero.html',
  styleUrls: ['./hero.scss']
})
export class Hero {
  @Input() imageUrl: string | null = null;

  @Input() title   = 'Exceptional brews, for you everytime!';
  @Input() subtitle = 'Válogatott kávéink személyes kiszállítással.';
  @Input() ctaText = 'Webshop';
  @Input() ctaLink = '/shop';
}
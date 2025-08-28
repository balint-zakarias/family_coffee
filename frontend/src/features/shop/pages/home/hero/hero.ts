import { Component, Input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'section-hero',
  standalone: true,
  imports: [RouterLink, NgStyle],
  templateUrl: 'hero.html',
  styleUrls: ['./hero.scss']
})
export class Hero {
  @Input() imageUrl: string = '/assets/hero.png';

  @Input() title   = 'Exceptional brews, for you everytime!';
  @Input() subtitle = 'Válogatott kávéink személyes kiszállítással.';
  @Input() ctaText = 'Webshop';
  @Input() ctaLink = '/shop';

  bgStyle = signal<{[k: string]: string}>({});
  
  ngOnInit() {
    const finalImageUrl = this.imageUrl || '/assets/hero.png';
    console.log('Hero image URL:', finalImageUrl);
    
    this.bgStyle.set({
      '--hero-bg': `url("${finalImageUrl}")`
    });
  }
}
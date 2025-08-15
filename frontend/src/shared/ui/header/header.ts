import { Component, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIf } from '@angular/common'; 

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class Header {
  cartCount = input<number>(0);
  readonly brand = signal({ family: '/assets/family_coffee_logo_transparent.png', nestle: '/assets/nestle.png'});
  readonly cartIcon = signal('/assets/cart.png');

  scrollToSection(sectionId: string) {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
import { Component, signal, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIf } from '@angular/common'; 
import { CartService } from 'core/cart.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class Header {
  
  readonly brand = signal({ family: '/assets/family_coffee_logo_transparent.png', nestle: '/assets/nestle.png'});
  readonly cartIcon = signal('/assets/cart.png');
  private cart = inject(CartService);
  cartCount = this.cart.count;

  ngOnInit() {
    this.cart.loadCountOnce();
  }

  scrollToSection(sectionId: string) {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
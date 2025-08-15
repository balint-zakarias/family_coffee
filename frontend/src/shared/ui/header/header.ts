import { Component, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class Header {
  cartCount = input<number>(0);
  readonly brand = signal({ family: '/assets/family_coffee_logo_transparent.png', nestle: '/assets/nestle.png'});
  readonly cartIcon = signal('/assets/cart.png');
}
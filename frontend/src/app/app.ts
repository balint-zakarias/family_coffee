import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Header } from '@shared/ui/header/header';
import { Footer } from '@shared/ui/footer/footer';
import { CookieBanner } from '@shared/ui/cookie-banner/cookie-banner';
import { CartService } from 'core/cart.service';
import { NgIf, AsyncPipe } from '@angular/common';
import { filter, map, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header, Footer, CookieBanner, NgIf, AsyncPipe],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  showHeaderFooter$: Observable<boolean>;

  constructor(
    private cart: CartService,
    private router: Router
  ) { 
    this.cart.loadCountOnce();
    
    this.showHeaderFooter$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map((event: NavigationEnd) => 
        !event.url.includes('/login') && !event.url.includes('/dashboard')
      ),
      startWith(
        !this.router.url.includes('/login') && !this.router.url.includes('/dashboard')
      )
    );
  }
}
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'page-order-success',
  standalone: true,
  imports: [],
  templateUrl: './order-success.html',
  styleUrls: ['./order-success.scss'],
})
export class OrderSuccess implements OnInit {
  orderId = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // Get orderId from query params (not URL path for security)
    this.route.queryParams.subscribe(params => {
      this.orderId.set(params['orderId'] || null);
      
      // If no orderId, redirect to shop
      if (!params['orderId']) {
        this.router.navigate(['/shop']);
      }
    });
  }

  navigateToShop() {
    this.router.navigate(['/shop']);
  }

  navigateToHome() {
    this.router.navigate(['/']);
  }
}

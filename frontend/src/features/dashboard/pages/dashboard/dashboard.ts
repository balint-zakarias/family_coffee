import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DashboardHeader } from '@shared/ui/dashboard-header/dashboard-header';

@Component({
  selector: 'page-dashboard',
  standalone: true,
  imports: [DashboardHeader, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class Dashboard implements OnInit {

  constructor(private router: Router) {}

  ngOnInit() {
    // Ellenőrizzük, hogy be van-e jelentkezve a felhasználó
    const userData = localStorage.getItem('familycoffee_user');
    if (!userData) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const user = JSON.parse(userData);
      if (!user.is_staff) {
        // Ha nem staff felhasználó, átirányítás
        this.router.navigate(['/']);
        return;
      }
    } catch (e) {
      console.error('Error parsing user data:', e);
      this.router.navigate(['/login']);
    }
  }
}

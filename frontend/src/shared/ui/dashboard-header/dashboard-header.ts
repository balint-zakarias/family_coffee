import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIf } from '@angular/common';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
}

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [NgIf, RouterLink, RouterLinkActive],
  templateUrl: './dashboard-header.html',
  styleUrls: ['./dashboard-header.scss']
})
export class DashboardHeader implements OnInit {
  user: User | null = null;

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadUser();
  }

  private loadUser() {
    const userData = localStorage.getItem('familycoffee_user');
    if (userData) {
      try {
        this.user = JSON.parse(userData);
      } catch (e) {
        console.error('Error parsing user data:', e);
        this.logout();
      }
    } else {
      // Ha nincs bejelentkezett felhasználó, átirányítás a login oldalra
      this.router.navigate(['/login']);
    }
  }

  logout() {
    localStorage.removeItem('familycoffee_user');
    this.router.navigate(['/login']);
  }

  getUserDisplayName(): string {
    if (!this.user) return '';
    return this.user.first_name || this.user.username || this.user.email;
  }

  goToMainSite() {
    this.router.navigate(['/']);
  }
}

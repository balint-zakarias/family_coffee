import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIf, DecimalPipe } from '@angular/common';
import { DashboardHeader } from '@shared/ui/dashboard-header/dashboard-header';
import { DashboardActivity } from '../../components/dashboard-activity/dashboard-activity';
import { Graphql } from '../../../../core/graphql.service';

interface DashboardStats {
  activeProductsCount: number;
  totalOrdersCount: number;
  deliveredOrdersRevenue: number;
}

@Component({
  selector: 'page-dashboard',
  standalone: true,
  imports: [DashboardHeader, DashboardActivity, RouterLink, NgIf, DecimalPipe],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class Dashboard implements OnInit {
  stats = signal<DashboardStats | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  constructor(private router: Router, private gql: Graphql) {}

  ngOnInit() {
    const userData = localStorage.getItem('familycoffee_user');
    if (!userData) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const user = JSON.parse(userData);
      if (!user.is_staff) {
        this.router.navigate(['/']);
        return;
      }
      
      this.loadStats();
    } catch (e) {
      console.error('Error parsing user data:', e);
      this.router.navigate(['/login']);
    }
  }

  async loadStats() {
    this.loading.set(true);
    this.error.set(null);

    const QUERY = /* GraphQL */ `
      query DashboardStats {
        dashboardStats {
          activeProductsCount
          totalOrdersCount
          deliveredOrdersRevenue
        }
      }
    `;

    try {
      const data = await this.gql.query<{ dashboardStats: DashboardStats }>(QUERY);
      this.stats.set(data.dashboardStats);
    } catch (e: any) {
      this.error.set(e?.message || 'Hiba a statisztikák betöltése során');
    } finally {
      this.loading.set(false);
    }
  }
}

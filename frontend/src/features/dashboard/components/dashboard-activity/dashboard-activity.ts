import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { Graphql } from '../../../../core/graphql.service';

interface RecentOrder {
  id: number;
  orderId: string;
  customerName: string;
  grandTotal: number;
  status: string;
  createdAt: string;
}

interface RecentMessage {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

interface RecentProduct {
  id: number;
  name: string;
  price: number;
  createdAt: string;
}

interface DashboardActivityData {
  recentOrders: RecentOrder[];
  recentMessages: RecentMessage[];
  recentProducts: RecentProduct[];
}

@Component({
  selector: 'dashboard-activity',
  standalone: true,
  imports: [DatePipe, DecimalPipe, NgClass],
  templateUrl: './dashboard-activity.html',
  styleUrls: ['./dashboard-activity.scss'],
})
export class DashboardActivity implements OnInit {
  activity = signal<DashboardActivityData | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  constructor(private gql: Graphql, private router: Router) {}

  ngOnInit() {
    this.loadActivity();
  }

  async loadActivity() {
    this.loading.set(true);
    this.error.set(null);

    const QUERY = /* GraphQL */ `
      query DashboardActivity {
        dashboardActivity {
          recentOrders {
            id
            orderId
            customerName
            grandTotal
            status
            createdAt
          }
          recentMessages {
            id
            name
            email
            createdAt
          }
          recentProducts {
            id
            name
            price
            createdAt
          }
        }
      }
    `;

    try {
      const data = await this.gql.query<{ dashboardActivity: DashboardActivityData }>(QUERY);
      this.activity.set(data.dashboardActivity);
    } catch (e: any) {
      this.error.set(e?.message || 'Hiba a tevékenységek betöltése során');
    } finally {
      this.loading.set(false);
    }
  }

  navigateToOrders() {
    this.router.navigate(['/dashboard/orders']);
  }

  navigateToMessages() {
    this.router.navigate(['/dashboard/contact-forms']);
  }

  navigateToProducts() {
    this.router.navigate(['/dashboard/products']);
  }

  getStatusText(status: string): string {
    switch (status.toLowerCase()) {
      case 'placed': return 'Leadva';
      case 'delivered': return 'Kiszállítva';
      case 'canceled': return 'Törölve';
      default: return status;
    }
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'placed': return 'status-placed';
      case 'delivered': return 'status-delivered';
      case 'canceled': return 'status-canceled';
      default: return '';
    }
  }
}

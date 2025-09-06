import { Component, OnInit, signal } from '@angular/core';
import { NgClass, DatePipe, DecimalPipe } from '@angular/common';
import { DashboardHeader } from '@shared/ui/dashboard-header/dashboard-header';
import { Graphql } from '../../../../core/graphql.service';

interface OrderItem {
  id: number;
  nameSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  lineTotal: number;
}

interface Order {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  status: string;
  grandTotal: number;
  createdAt: string;
  items: OrderItem[];
}

@Component({
  selector: 'page-orders',
  standalone: true,
  imports: [DashboardHeader, NgClass, DatePipe, DecimalPipe],
  templateUrl: './orders.html',
  styleUrls: ['./orders.scss'],
})
export class Orders implements OnInit {
  orders = signal<Order[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  
  // Szűrők
  selectedStatus = signal<string | null>(null);

  constructor(private gql: Graphql) {}

  ngOnInit() {
    this.loadOrders();
  }

  async loadOrders() {
    this.loading.set(true);
    this.error.set(null);

    const QUERY = /* GraphQL */ `
      query GetOrders($status: String) {
        orders(status: $status) {
          id
          customerName
          customerEmail
          customerPhone
          shippingAddress
          shippingCity
          status
          grandTotal
          createdAt
          items {
            id
            nameSnapshot
            unitPriceSnapshot
            quantity
            lineTotal
          }
        }
      }
    `;

    try {
      const variables: any = {};
      if (this.selectedStatus()) {
        variables.status = this.selectedStatus();
      }

      const data = await this.gql.query<{ orders: Order[] }>(QUERY, variables);
      console.log('Orders data:', data.orders);
      this.orders.set(data.orders || []);
    } catch (e: any) {
      this.error.set(e?.message || 'Hiba a rendelések betöltése során');
    } finally {
      this.loading.set(false);
    }
  }

  onStatusFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedStatus.set(target.value || null);
    this.loadOrders();
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

  getTotalItems(order: Order): number {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  async updateOrderStatus(orderId: number, newStatus: string) {
    const MUTATION = /* GraphQL */ `
      mutation UpdateOrderStatus($orderId: Int!, $status: String!) {
        updateOrderStatus(orderId: $orderId, status: $status) {
          success
          order {
            id
            status
          }
        }
      }
    `;

    try {
      const result = await this.gql.mutate<{ updateOrderStatus: { success: boolean; order: { id: number; status: string } } }>(
        MUTATION,
        { orderId: parseInt(orderId.toString()), status: newStatus }
      );

      if (result.updateOrderStatus.success) {
        // Frissítjük a helyi állapotot
        this.orders.update(orders => 
          orders.map(order => 
            order.id === orderId 
              ? { ...order, status: newStatus }
              : order
          )
        );
      }
    } catch (e: any) {
      alert(`Hiba történt: ${e?.message || 'Ismeretlen hiba'}`);
    }
  }
}

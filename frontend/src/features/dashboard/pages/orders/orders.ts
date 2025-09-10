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
  sku?: string;
}

interface Order {
  id: number;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  billingAddress: string;
  billingCity: string;
  billingZip: string;
  shippingAddress: string;
  shippingCity: string;
  shippingZip: string;
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
  
  // Modal állapot
  selectedOrder = signal<Order | null>(null);
  showModal = signal<boolean>(false);

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
          orderId
          customerName
          customerEmail
          customerPhone
          billingAddress
          billingCity
          billingZip
          shippingAddress
          shippingCity
          shippingZip
          status
          grandTotal
          createdAt
          items {
            id
            nameSnapshot
            unitPriceSnapshot
            quantity
            lineTotal
            sku
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

  openOrderDetails(order: Order) {
    this.selectedOrder.set(order);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.selectedOrder.set(null);
  }

  async updateOrderStatus(orderId: string, newStatus: string) {
    const MUTATION = /* GraphQL */ `
      mutation UpdateOrderStatus($orderId: String!, $status: String!) {
        updateOrderStatus(orderId: $orderId, status: $status) {
          success
          order {
            orderId
            status
          }
        }
      }
    `;

    try {
      const result = await this.gql.mutate<{ updateOrderStatus: { success: boolean; order: { id: number; status: string } } }>(
        MUTATION,
        { orderId: orderId.toString(), status: newStatus }
      );

      if (result.updateOrderStatus.success) {
        // Frissítjük a helyi állapotot
        this.orders.update(orders => 
          orders.map(order => 
            order.orderId === orderId 
              ? { ...order, status: newStatus }
              : order
          )
        );

        // Ha modal nyitva van és ez a rendelés van kiválasztva, frissítjük azt is
        if (this.selectedOrder() && this.selectedOrder()!.orderId === orderId) {
          this.selectedOrder.update(order => 
            order ? { ...order, status: newStatus } : null
          );
        }
      }
    } catch (e: any) {
      alert(`Hiba történt: ${e?.message || 'Ismeretlen hiba'}`);
    }
  }
}

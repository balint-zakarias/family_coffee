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
  customerTaxId: string;
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
  searchQuery = signal<string>('');
  
  // Pagination
  currentPage = signal<number>(1);
  pageSize = 20;
  hasMore = signal<boolean>(true);
  
  // Modal állapot
  selectedOrder = signal<Order | null>(null);
  showModal = signal<boolean>(false);

  constructor(private gql: Graphql) {}

  ngOnInit() {
    this.loadOrders();
  }

  async loadOrders(loadMore = false) {
    this.loading.set(true);
    this.error.set(null);

    const offset = loadMore ? (this.currentPage() - 1) * this.pageSize : 0;

    const QUERY = /* GraphQL */ `
      query GetOrders($status: String, $search: String, $limit: Int, $offset: Int) {
        orders(status: $status, search: $search, limit: $limit, offset: $offset) {
          id
          orderId
          customerName
          customerTaxId
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
      const variables: any = {
        limit: this.pageSize,
        offset: offset
      };
      if (this.selectedStatus()) {
        variables.status = this.selectedStatus();
      }
      if (this.searchQuery()) {
        variables.search = this.searchQuery();
      }

      const data = await this.gql.query<{ orders: Order[] }>(QUERY, variables);
      
      if (loadMore) {
        this.orders.update(current => [...current, ...data.orders]);
      } else {
        this.orders.set(data.orders || []);
        this.currentPage.set(1);
      }
      
      this.hasMore.set(data.orders.length === this.pageSize);
    } catch (e: any) {
      this.error.set(e?.message || 'Hiba a rendelések betöltése során');
    } finally {
      this.loading.set(false);
    }
  }

  loadMore() {
    if (this.hasMore() && !this.loading()) {
      this.currentPage.update(page => page + 1);
      this.loadOrders(true);
    }
  }

  onStatusFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedStatus.set(target.value || null);
    this.loadOrders();
  }

  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
    this.loadOrders();
  }

  clearSearch() {
    this.searchQuery.set('');
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

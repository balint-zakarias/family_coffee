import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgIf, NgFor, CurrencyPipe, DatePipe, SlicePipe } from '@angular/common';
import { DashboardHeader } from '@shared/ui/dashboard-header/dashboard-header';
import { Graphql } from '../../../../core/graphql.service';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  imageUrl: string | null;
  category: {
    id: number;
    name: string;
    slug: string;
  } | null;
  sku: string;
  stockQty: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

@Component({
  selector: 'page-products',
  standalone: true,
  imports: [DashboardHeader, NgIf, NgFor, CurrencyPipe, DatePipe, SlicePipe],
  templateUrl: './products.html',
  styleUrls: ['./products.scss'],
})
export class Products implements OnInit {
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  
  // Szűrők
  selectedCategoryId = signal<number | null>(null);
  searchTerm = signal<string>('');
  showInactiveProducts = signal<boolean>(false);

  constructor(
    private router: Router,
    private gql: Graphql
  ) {}

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
        this.router.navigate(['/']);
        return;
      }
    } catch (e) {
      console.error('Error parsing user data:', e);
      this.router.navigate(['/login']);
      return;
    }

    this.loadData();
  }

  async loadData() {
    await Promise.all([
      this.loadProducts(),
      this.loadCategories()
    ]);
  }

  private async loadProducts() {
    this.loading.set(true);
    this.error.set(null);

    const QUERY = /* GraphQL */ `
      query GetProducts($categoryId: Int, $search: String, $isActive: Boolean) {
        products(categoryId: $categoryId, search: $search, isActive: $isActive, limit: 100) {
          id
          name
          slug
          description
          price
          imageUrl
          category {
            id
            name
            slug
          }
          sku
          stockQty
          isActive
          createdAt
          updatedAt
        }
      }
    `;

    try {
      const variables: any = {};
      
      if (this.selectedCategoryId()) {
        variables.categoryId = this.selectedCategoryId();
      }
      
      if (this.searchTerm().trim()) {
        variables.search = this.searchTerm().trim();
      }
      
      if (this.showInactiveProducts()) {
        variables.isActive = null; // Show all products
      } else {
        variables.isActive = true; // Show only active products
      }

      const data = await this.gql.query<{ products: Product[] }>(QUERY, variables);
      this.products.set(data.products || []);
      
    } catch (e: any) {
      console.error('Error loading products:', e);
      this.error.set(e?.message || 'Hiba a termékek betöltése során');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadCategories() {
    const QUERY = /* GraphQL */ `
      query GetCategories {
        categories {
          id
          name
          slug
        }
      }
    `;

    try {
      const data = await this.gql.query<{ categories: Category[] }>(QUERY);
      this.categories.set(data.categories || []);
    } catch (e: any) {
      console.error('Error loading categories:', e);
    }
  }

  onCategoryChange(categoryId: string) {
    const id = categoryId === '' ? null : parseInt(categoryId, 10);
    this.selectedCategoryId.set(id);
    this.loadProducts();
  }

  onSearchChange(searchTerm: string) {
    this.searchTerm.set(searchTerm);
    // Debounce search - wait 500ms after user stops typing
    setTimeout(() => {
      if (this.searchTerm() === searchTerm) {
        this.loadProducts();
      }
    }, 500);
  }

  onShowInactiveChange(showInactive: boolean) {
    this.showInactiveProducts.set(showInactive);
    this.loadProducts();
  }

  getProductImageUrl(product: Product): string {
    return product.imageUrl || '/assets/placeholder-product.jpg';
  }

  getStockStatusClass(stockQty: number): string {
    if (stockQty === 0) return 'out-of-stock';
    if (stockQty < 10) return 'low-stock';
    return 'in-stock';
  }

  getStockStatusText(stockQty: number): string {
    if (stockQty === 0) return 'Nincs készleten';
    if (stockQty < 10) return 'Kevés készlet';
    return 'Készleten';
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }
}

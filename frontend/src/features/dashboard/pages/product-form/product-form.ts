import { Component, OnInit, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardHeader } from '@shared/ui/dashboard-header/dashboard-header';
import { Graphql } from '../../../../core/graphql.service';

interface Product {
  id?: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  categoryId: number | null;
  sku: string;
  stockQty: number;
  isActive: boolean;
}

interface Category {
  id: number;
  name: string;
}

@Component({
  selector: 'page-product-form',
  standalone: true,
  imports: [DashboardHeader, NgIf, NgFor, FormsModule],
  templateUrl: './product-form.html',
  styleUrls: ['./product-form.scss'],
})
export class ProductForm implements OnInit {
  mode: 'create' | 'edit' | 'view' = 'create';
  productSlug: string | null = null;
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  error = signal<string | null>(null);
  categories = signal<Category[]>([]);

  product = signal<Product>({
    name: '',
    description: '',
    price: 0,
    imageUrl: null,
    categoryId: null,
    sku: '',
    stockQty: 0,
    isActive: true
  });

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private gql: Graphql
  ) {}

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
    } catch (e) {
      this.router.navigate(['/login']);
      return;
    }

    this.route.params.subscribe(params => {
      if (params['slug']) {
        this.productSlug = params['slug'];
        this.mode = this.route.snapshot.url[this.route.snapshot.url.length - 1].path === 'view' ? 'view' : 'edit';
        this.loadProduct();
      } else {
        this.mode = 'create';
      }
    });

    this.loadCategories();
  }

  async loadProduct() {
    if (!this.productSlug) return;

    this.loading.set(true);
    this.error.set(null);

    const QUERY = /* GraphQL */ `
      query GetProduct($slug: String!) {
        product(slug: $slug) {
          id
          name
          description
          price
          imageUrl
          category { id }
          sku
          stockQty
          isActive
        }
      }
    `;

    try {
      const data = await this.gql.query<{ product: any }>(QUERY, { slug: this.productSlug });
      if (data.product) {
        this.product.set({
          ...data.product,
          categoryId: data.product.category?.id || null
        });
      }
    } catch (e: any) {
      this.error.set(e?.message || 'Hiba a termék betöltése során');
    } finally {
      this.loading.set(false);
    }
  }

  async loadCategories() {
    const QUERY = /* GraphQL */ `
      query GetCategories {
        categories { id name }
      }
    `;

    try {
      const data = await this.gql.query<{ categories: Category[] }>(QUERY);
      this.categories.set(data.categories || []);
    } catch (e: any) {
      console.error('Error loading categories:', e);
    }
  }

  async onSubmit() {
    if (this.mode === 'view') return;

    this.saving.set(true);
    this.error.set(null);

    try {
      if (this.mode === 'create') {
        await this.createProduct();
      } else {
        await this.updateProduct();
      }
      this.router.navigate(['/dashboard/products']);
    } catch (e: any) {
      this.error.set(e?.message || 'Hiba a mentés során');
    } finally {
      this.saving.set(false);
    }
  }

  private async createProduct() {
    const MUTATION = /* GraphQL */ `
      mutation CreateProduct($input: ProductInput!) {
        createProduct(input: $input) { id }
      }
    `;

    await this.gql.mutate(MUTATION, { input: this.product() });
  }

  private async updateProduct() {
    const MUTATION = /* GraphQL */ `
      mutation UpdateProduct($slug: String!, $input: ProductInput!) {
        updateProduct(slug: $slug, input: $input) { id }
      }
    `;

    await this.gql.mutate(MUTATION, { slug: this.productSlug, input: this.product() });
  }

  onCancel() {
    this.router.navigate(['/dashboard/products']);
  }

  get title(): string {
    switch (this.mode) {
      case 'create': return 'Új termék';
      case 'edit': return 'Termék szerkesztése';
      case 'view': return 'Termék megtekintése';
    }
  }

  get isReadonly(): boolean {
    return this.mode === 'view';
  }

  onImageError(event: any) {
    event.target.style.display = 'none';
  }
}

import { Component, OnInit, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardHeader } from '@shared/ui/dashboard-header/dashboard-header';
import { Graphql } from '../../../../core/graphql.service';
import { Product } from '../../../../core/models';

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

  product = signal<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    imageUrl: null,
    category: null,
    sku: '',
    ean: '',
    eanCarton: '',
    neta: 0,
    vat: 27.00,
    stockQty: 0,
    isActive: true
  });

  selectedFile: File | null = null;

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
          category { id name }
          sku
          ean
          eanCarton
          neta
          vat
          stockQty
          isActive
        }
      }
    `;

    try {
      const data = await this.gql.query<{ product: any }>(QUERY, { slug: this.productSlug });
      if (data.product) {
        this.product.set({
          id: data.product.id,
          name: data.product.name,
          description: data.product.description || '',
          price: Math.round(data.product.price),
          imageUrl: data.product.imageUrl,
          category: data.product.category,
          sku: data.product.sku,
          ean: data.product.ean || '',
          eanCarton: data.product.eanCarton || '',
          neta: data.product.neta || 0,
          vat: data.product.vat || 27.00,
          stockQty: data.product.stockQty,
          isActive: data.product.isActive
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
      mutation CreateProduct($input: ProductInput!, $image: Upload) {
        createProduct(input: $input, image: $image) { product { id } }
      }
    `;

    const input = {
      name: this.product().name,
      description: this.product().description,
      price: this.product().price,
      sku: this.product().sku,
      ean: this.product().ean,
      eanCarton: this.product().eanCarton,
      neta: this.product().neta,
      vat: this.product().vat,
      stockQty: this.product().stockQty,
      isActive: this.product().isActive,
      categoryId: this.product().category ? parseInt(this.product().category!.id.toString()) : null
    };

    if (this.selectedFile) {
      await this.gql.mutateMultipart(MUTATION, { input, image: this.selectedFile });
    } else {
      await this.gql.mutate(MUTATION, { input });
    }
  }

  private async updateProduct() {
    const MUTATION = /* GraphQL */ `
      mutation UpdateProduct($input: ProductInput!, $image: Upload) {
        updateProduct(input: $input, image: $image) { id }
      }
    `;

    const input = {
      id: this.product().id,
      name: this.product().name,
      description: this.product().description,
      price: parseFloat(this.product().price?.toString() || '0'),
      sku: this.product().sku,
      ean: this.product().ean,
      eanCarton: this.product().eanCarton,
      neta: parseFloat(this.product().neta?.toString() || '0'),
      vat: parseFloat(this.product().vat?.toString() || '27'),
      stockQty: this.product().stockQty,
      isActive: this.product().isActive,
      categoryId: this.product().category ? parseInt(this.product().category!.id.toString()) : null
    };

    if (this.selectedFile) {
      await this.gql.mutateMultipart(MUTATION, { input, image: this.selectedFile });
    } else {
      await this.gql.mutate(MUTATION, { input });
    }
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
    return '';
  }

  get isReadonly(): boolean {
    return this.mode === 'view';
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.product.update(p => ({ ...p, imageUrl: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  }

  onImageError(event: any) {
    event.target.style.display = 'none';
  }
}

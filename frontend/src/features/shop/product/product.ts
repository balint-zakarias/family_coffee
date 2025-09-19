import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Graphql } from '../../../core/graphql.service';
import { CartService } from '../../../core/cart.service';

interface ProductDetail {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  category: {
    id: number;
    name: string;
  } | null;
  sku: string;
  stockQty: number;
  isActive: boolean;
  onlyForRent: boolean;
}

@Component({
  selector: 'page-product',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './product.html',
  styleUrls: ['./product.scss'],
})
export class Product implements OnInit {
  product = signal<ProductDetail | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  quantity = signal<number>(1);
  addingToCart = signal<boolean>(false);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private gql: Graphql,
    private cartService: CartService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['slug']) {
        this.loadProduct(params['slug']);
      }
    });
  }

  async loadProduct(slug: string) {
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
          category {
            id
            name
          }
          sku
          stockQty
          isActive
          onlyForRent
        }
      }
    `;

    try {
      const data = await this.gql.query<{ product: ProductDetail }>(QUERY, { slug });
      if (data.product && data.product.isActive) {
        this.product.set(data.product);
      } else {
        this.error.set('A termék nem található vagy nem elérhető');
      }
    } catch (e: any) {
      this.error.set(e?.message || 'Hiba a termék betöltése során');
    } finally {
      this.loading.set(false);
    }
  }

  async addToCart() {
    const product = this.product();
    if (!product || this.addingToCart()) return;

    this.addingToCart.set(true);

    try {
      await this.cartService.add(product.id.toString(), this.quantity());
    } catch (e: any) {
      alert(`Hiba történt: ${e?.message || 'Ismeretlen hiba'}`);
    } finally {
      this.addingToCart.set(false);
    }
  }

  getProductImageUrl(): string {
    return this.product()?.imageUrl || '/assets/placeholder-product.jpg';
  }

  goBack() {
    this.router.navigate(['/shop']);
  }

  increaseQuantity() {
    this.quantity.update(q => q + 1);
  }

  decreaseQuantity() {
    this.quantity.update(q => Math.max(1, q - 1));
  }

  getStockClass(): string {
    const stock = this.product()?.stockQty || 0;
    if (stock === 0) return 'out-of-stock';
    if (stock < 10) return 'low-stock';
    return 'in-stock';
  }

  getStockText(): string {
    const stock = this.product()?.stockQty || 0;
    if (stock === 0) return 'Nincs készleten';
    if (stock < 10) return `${stock} db (kevés)`;
    return `${stock} db`;
  }
}

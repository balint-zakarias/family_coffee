import { Component, signal } from '@angular/core';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';
import { Graphql } from '../../../../core/graphql.service';
import { ProductCard, UiProduct } from '../../../../shared/ui/product-card/product-card';

@Component({
  selector: 'page-list',
  standalone: true,
  imports: [NgIf, NgFor, DecimalPipe, ProductCard],
  templateUrl: './list.html',
  styleUrls: ['./list.scss']
})
export class List {
  loading = signal(false);
  error = signal<string | null>(null);
  products = signal<UiProduct[]>([]);

  constructor(private gql: Graphql) {
    this.load();
  }

  async load(search?: string) {
    this.loading.set(true);
    this.error.set(null);
    const query = `
      query($search: String, $limit: Int) {
        products(search: $search, limit: $limit) {
          name
          price
          imageUrl
        }
      }
    `;
    try {
      const data = await this.gql.query<{products: UiProduct[]}>(query, { search, limit: 12 });
      this.products.set(data.products);
    } catch (e: any) {
      this.error.set(String(e?.message || e));
    } finally {
      this.loading.set(false);
    }
  }
}
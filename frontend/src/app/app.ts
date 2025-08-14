import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';

type GqlProduct = {
  name: string;
  price: number;
  imageUrl?: string | null;
  category?: { name: string; slug: string } | null;
};

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgIf, NgFor, DecimalPipe],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  title = signal('FamilyCoffee');
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  products = signal<GqlProduct[]>([]);

  constructor() {
    this.fetchProducts();
  }

  fetchProducts(search?: string) {
    this.loading.set(true);
    this.error.set(null);

    const query = `
      query($search: String, $limit: Int) {
        products(search: $search, limit: $limit) {
          name
          price
          imageUrl
          category { name slug }
        }
      }
    `;

    fetch('/graphql/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { search, limit: 20 } }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.errors?.length) throw new Error(data.errors[0].message ?? 'GraphQL error');
        return data.data.products as GqlProduct[];
      })
      .then((rows: GqlProduct[]) => this.products.set(rows))
      .catch((e) => this.error.set(String(e)))
      .finally(() => this.loading.set(false));
  }
}
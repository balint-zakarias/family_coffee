import { Component, signal, OnInit } from '@angular/core';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Graphql } from '../../../../core/graphql.service';
import { ProductCard, UiProduct } from '../../../../shared/ui/product-card/product-card';

type Category = { id: string; name: string; slug: string };

@Component({
  selector: 'page-list',
  standalone: true,
  imports: [NgIf, NgFor, DecimalPipe, ProductCard],
  templateUrl: './list.html',
  styleUrls: ['./list.scss']
})
export class List implements OnInit {
  loading = signal(false);
  error = signal<string | null>(null);

  products = signal<UiProduct[]>([]);
  categories = signal<Category[]>([]);
  selectedCategory = signal<string | null>(null); // <-- SLUG vagy null
  search = signal<string>('');                    // keresőkifejezés

  constructor(
    private gql: Graphql,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCategories().then(() => {
      this.route.queryParamMap.subscribe(params => {
        // 'category' az URL-ben SLUG lesz
        this.selectedCategory.set(params.get('category'));
        this.search.set(params.get('q') ?? '');
        this.load(); // a search() és selectedCategory() alapján tölt
      });
    });
  }

  async load() {
    this.loading.set(true);
    this.error.set(null);

    // ⬇️ Slugot kér a backend (String)
    const query = `
      query($search: String, $limit: Int, $categorySlug: String) {
        products(search: $search, categorySlug: $categorySlug, limit: $limit) {
          name
          description
          price
          imageUrl
        }
      }
    `;

    try {
      const variables: any = { search: this.search(), limit: 12 };
      if (this.selectedCategory()) variables.categorySlug = this.selectedCategory();

      const data = await this.gql.query<{products: UiProduct[]}>(
        query,
        variables
      );
      this.products.set(data.products);
    } catch (e: any) {
      this.error.set(String(e?.message || e));
    } finally {
      this.loading.set(false);
    }
  }

  async loadCategories() {
    const query = `query { categories { id name slug } }`;
    const data = await this.gql.query<{categories: Category[]}>(query);
    this.categories.set(data.categories);
  }

  // kategória választás – az URL-ben sluggal dolgozunk
  selectCategory(slug: string | null) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: slug || null, q: this.search() || null },
      queryParamsHandling: 'merge'
    });
  }

  // keresés gomb/enter
  doSearch() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: this.search() || null, category: this.selectedCategory() || null },
      queryParamsHandling: 'merge'
    });
  }
}
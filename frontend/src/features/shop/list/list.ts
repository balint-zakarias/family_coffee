import { Component, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Graphql } from '../../../core/graphql.service';
import { ProductCard, UiProduct } from '../../../shared/ui/product-card/product-card';
import { CartService } from 'core/cart.service';


type Category = { id: string; name: string; slug: string };

@Component({
  selector: 'page-list',
  standalone: true,
  imports: [ProductCard],
  templateUrl: './list.html',
  styleUrls: ['./list.scss']
})
export class List implements OnInit {
  loading = signal(false);
  error = signal<string | null>(null);
  addingToCart = signal(false); // Globális kosárba helyezés állapot

  products = signal<UiProduct[]>([]);
  categories = signal<Category[]>([]);
  selectedCategory = signal<string | null>(null);
  search = signal<string>('');
  
  // Pagination
  currentPage = signal<number>(1);
  pageSize = 50;
  hasMore = signal<boolean>(true);

  constructor(
    private gql: Graphql,
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService
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

  async load(loadMore = false): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    const offset = loadMore ? (this.currentPage() - 1) * this.pageSize : 0;

    const query = `
      query($search: String, $limit: Int, $offset: Int, $categorySlug: String) {
        products(search: $search, categorySlug: $categorySlug, limit: $limit, offset: $offset) {
          id
          name
          slug
          description
          price
          imageUrl
          onlyForRent
        }
      }
    `;

    try {
      const variables: any = { 
        search: this.search(),
        limit: this.pageSize,
        offset: offset
      };
      if (this.selectedCategory()) variables.categorySlug = this.selectedCategory();

      const data = await this.gql.query<{products: UiProduct[]}>(
        query,
        variables
      );
      
      if (loadMore) {
        this.products.update(current => [...current, ...data.products]);
      } else {
        this.products.set(data.products);
        this.currentPage.set(1);
      }
      
      this.hasMore.set(data.products.length === this.pageSize);
    } catch (e: any) {
      this.error.set(String(e?.message || e));
    } finally {
      this.loading.set(false);
    }
  }

  loadMore() {
    if (this.hasMore() && !this.loading()) {
      this.currentPage.update(page => page + 1);
      this.load(true);
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

  onSearchChange(searchTerm: string) {
    this.search.set(searchTerm);
    // Debounce search - wait 500ms after user stops typing
    setTimeout(() => {
      if (this.search() === searchTerm) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { q: searchTerm || null, category: this.selectedCategory() || null },
          queryParamsHandling: 'merge'
        });
      }
    }, 500);
  }

  clearSearch() {
    this.search.set('');
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: null, category: this.selectedCategory() || null },
      queryParamsHandling: 'merge'
    });
  }

  clearFilters() {
    this.search.set('');
    this.selectedCategory.set(null);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: null, category: null },
      queryParamsHandling: 'merge'
    });
  }

  async onAddToCart(p: UiProduct) {
    if (!p?.id || this.addingToCart()) return;
    
    this.addingToCart.set(true);
    try {
      await this.cartService.add(String(p.id), 1);
    } catch (err) {
      console.error(err);
    } finally {
      // 2 másodperc után engedjük újra a gombokat
      setTimeout(() => {
        this.addingToCart.set(false);
      }, 2000);
    }
  }
  
  onViewDetails(p: UiProduct) {
    if (!p?.slug || this.addingToCart()){
      if (this.addingToCart()) return; // Ne navigáljon animáció alatt
      console.error('Nincs slug a termékhez!');
      return;
    }
    this.router.navigate(['/shop/product', p.slug]);
  }
}
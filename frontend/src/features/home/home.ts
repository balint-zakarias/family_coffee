import { signal, Component, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Hero } from './hero/hero';
import { PopularProducts } from './popular-products/popular-products';
import { Contact } from './contact/contact';
import { About } from './about/about';
import  { Graphql } from '../../core/graphql.service';

type SiteContent = {
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroButtonText: string | null;
  heroButtonUrl: string | null;
  heroImageUrl: string | null;
  heroImageMobile: string | null;
  aboutTitle: string | null;
  aboutSubtitle: string | null;
  aboutImageUrl: string | null;
  aboutBody: string | null;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  imageUrl: string | null;
};

@Component({
  selector: 'page-home',
  standalone: true,
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
  imports: [Hero, PopularProducts, About, Contact]
})
export class Home {
  private platformId = inject(PLATFORM_ID);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  popularProducts = signal<Product[]>([]);

  heroImageUrl = signal<string | null>(null);
  heroImageUrlMobile = signal<string | null>(null);
  title = signal<string | null>(null);
  subtitle = signal<string | null>(null);
  ctaText = signal<string | null>(null);
  ctaLink = signal<string | null>(null);
  aboutTitle = signal<string | null>(null);
  aboutSubtitle = signal<string | null>(null);
  aboutImageUrl = signal<string | null>(null);
  aboutBody = signal<string | null>(null);

  // Computed property to get the appropriate hero image based on screen size
  currentHeroImage = computed(() => {
    if (!isPlatformBrowser(this.platformId)) {
      return this.heroImageUrl();
    }
    
    const isMobile = window.innerWidth <= 768;
    return isMobile && this.heroImageUrlMobile() 
      ? this.heroImageUrlMobile() 
      : this.heroImageUrl();
  });

  constructor(private gql: Graphql) {
    this.load();
    this.loadPopularProducts();
  }

  private normalizeUrl(url: string | null): string | null {
    if (!url) return null;
    const trimmed = url.trim();
    if (trimmed.startsWith('http')) return trimmed;
    if (trimmed.startsWith('/')) return trimmed;
    return `/${trimmed}`;
  }

  private async load() {
    this.loading.set(true);
    this.error.set(null);

    const QUERY = /* GraphQL */ `
      query HomeSiteContent {
        siteContent {
          heroTitle
          heroSubtitle
          heroButtonText
          heroButtonUrl
          heroImageUrl
          heroImageMobile
          aboutTitle
          aboutSubtitle
          aboutImageUrl
          aboutBody
        }
      }
    `;

    try {
      const data = await this.gql.query<{ siteContent: SiteContent | null }>(QUERY);

      if (data.siteContent) {
        const sc = data.siteContent;

        if (sc.heroTitle) this.title.set(sc.heroTitle);
        if (sc.heroSubtitle) this.subtitle.set(sc.heroSubtitle);
        if (sc.heroButtonText) this.ctaText.set(sc.heroButtonText);
        if (sc.heroButtonUrl) this.ctaLink.set(sc.heroButtonUrl);
        if (sc.aboutTitle) this.aboutTitle.set(sc.aboutTitle);
        if (sc.aboutSubtitle) this.aboutSubtitle.set(sc.aboutSubtitle);
        if (sc.aboutBody) this.aboutBody.set(sc.aboutBody);

        if (sc.heroImageUrl) this.heroImageUrl.set(this.normalizeUrl(sc.heroImageUrl));
        if (sc.heroImageMobile) this.heroImageUrlMobile.set(this.normalizeUrl(sc.heroImageMobile));
        if (sc.aboutImageUrl) this.aboutImageUrl.set(this.normalizeUrl(sc.aboutImageUrl));
      }
    } catch (e: any) {
      this.error.set(String(e?.message || e));
    } finally {
      this.loading.set(false);
    }
  }

  private async loadPopularProducts() {
    const QUERY = /* GraphQL */ `
      query PopularProducts {
        popularProducts {
          id
          name
          slug
          description
          price
          imageUrl
        }
      }
    `;
  
    try {
      const data = await this.gql.query<{ popularProducts: Product[] }>(QUERY);
      if (data.popularProducts) {
        this.popularProducts.set(data.popularProducts);
      }
    } catch (e: any) {
      console.error('Hiba a népszerű termékek betöltésekor:', e);
    }
  }
}
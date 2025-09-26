import { Component, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { List } from '../list/list';
import { Graphql } from '../../../core/graphql.service';


type SiteContent = {
  webshopImageUrl: string | null;
  webshopImageMobile: string | null;
};

@Component({
  selector: 'page-webshop',
  standalone: true,
  imports: [List],
  templateUrl: './webshop.html',
  styleUrls: ['./webshop.scss'],
})
export class Webshop {
  private platformId = inject(PLATFORM_ID);
  loading = signal<boolean>(true);
  error   = signal<string | null>(null);

  heroImage = signal<string | null>(null);
  heroImageMobile = signal<string | null>(null);

  // Computed property to get the appropriate hero image based on screen size
  currentHeroImage = computed(() => {
    if (!isPlatformBrowser(this.platformId)) {
      return this.heroImage();
    }
    
    const isMobile = window.innerWidth <= 768;
    return isMobile && this.heroImageMobile() 
      ? this.heroImageMobile() 
      : this.heroImage();
  });

  // csak a markuphoz – később GraphQL-ből
  readonly categories = ['Szemes kávé', 'Oldódó kávé', 'Kakaó italok', 'Tejporok', 'Egyéb italok', 'Kiegészítők'];
  readonly brands = ['NESCAFÉ', 'Nestlé', 'Gloria', 'Caro'];
  readonly sortings = ['Népszerűség', 'Ár növekvő', 'Ár csökkenő', 'Név A–Z', 'Név Z–A'];

  constructor(private gql: Graphql) {
    this.loadHero();
  }

  private normalize(url: string | null): string | null {
    if (!url) return null;
    const u = url.trim();
    if (u.startsWith('http') || u.startsWith('/')) return u;
    return `/${u}`;
  }

  private async loadHero() {
    this.loading.set(true);
    this.error.set(null);

    const QUERY = /* GraphQL */ `
      query WebshopSiteContent {
        siteContent {
          webshopImageUrl
          webshopImageMobile
        }
      }
    `;

    try {
      const data = await this.gql.query<{ siteContent: SiteContent | null }>(QUERY);
      if (data.siteContent) {
        this.heroImage.set(this.normalize(data.siteContent.webshopImageUrl));
        this.heroImageMobile.set(this.normalize(data.siteContent.webshopImageMobile));
      }
    } catch (e: any) {
      this.error.set(String(e?.message || e));
    } finally {
      this.loading.set(false);
    }
  }
}
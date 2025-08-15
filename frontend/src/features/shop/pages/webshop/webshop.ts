import { Component, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { List } from '../list/list';
import { Graphql } from '../../../../core/graphql.service';


type SiteContent = {
  webshopImageUrl: string | null;
};

@Component({
  selector: 'page-webshop',
  standalone: true,
  imports: [NgIf, NgFor, List],
  templateUrl: './webshop.html',
  styleUrls: ['./webshop.scss'],
})
export class Webshop {
  loading = signal<boolean>(true);
  error   = signal<string | null>(null);

  heroImage = signal<string | null>(null);

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
        }
      }
    `;

    try {
      const data = await this.gql.query<{ siteContent: SiteContent | null }>(QUERY);
      const url = data.siteContent?.webshopImageUrl ?? null;
      this.heroImage.set(this.normalize(url));
    } catch (e: any) {
      this.error.set(String(e?.message || e));
    } finally {
      this.loading.set(false);
    }
  }
}
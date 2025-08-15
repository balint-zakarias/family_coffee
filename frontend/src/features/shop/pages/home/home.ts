import { Component, signal } from '@angular/core';
import { Hero } from './hero/hero';
import { RouterLink } from '@angular/router';
import { Graphql } from '../../../../core/graphql.service';
import { NgIf, NgFor } from '@angular/common';

type SiteContent = {
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroButtonText: string | null;
  heroButtonUrl: string | null;
  heroImage: string | null;
};

@Component({
  selector: 'page-home',
  standalone: true,
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
  imports: [NgIf, NgFor, Hero, RouterLink]
})
export class Home {
  loading = signal<boolean>(true);
  error   = signal<string | null>(null);

  imageUrl  = signal<string>('/assets/hero.png'); // fallback kép (vagy marad gradient)
  title     = signal<string>('Exceptional brews, for you everytime!');
  subtitle  = signal<string>('Válogatott kávéink személyes kiszállítással.');
  ctaText   = signal<string>('Webshop');
  ctaLink   = signal<string>('/shop');


  constructor(private gql: Graphql) {
    this.load();
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
          heroImage
        }
      }
    `;

    try {
      const data = await this.gql.query<{ siteContent: SiteContent | null }>(QUERY);

      if (data.siteContent) {
        const sc = data.siteContent;

        if (sc.heroTitle)    this.title.set(sc.heroTitle);
        if (sc.heroSubtitle) this.subtitle.set(sc.heroSubtitle);
        if (sc.heroButtonText) this.ctaText.set(sc.heroButtonText);
        if (sc.heroButtonUrl) this.ctaLink.set(sc.heroButtonUrl);

        // kép URL normalizálása:
        // - ha a backend teljes URL-t ad (http...), használjuk
        // - ha relatív pl. "/media/...", az Angular dev proxy kiszolgálja → használható
        if (sc.heroImage) {
          const url = sc.heroImage.trim();
          if (url.startsWith('http')) {
            this.imageUrl.set(url);
          } else if (url.startsWith('/')) {
            this.imageUrl.set(url); // pl. "/media/site/hero.jpg"
          } else {
            // biztonság kedvéért relatív eset: tegyünk elé perjelet
            this.imageUrl.set('/' + url);
          }
        }
      }
    } catch (e: any) {
      this.error.set(String(e?.message || e));
    } finally {
      this.loading.set(false);
    }
  }

    popularProducts = [
        {
          id: 1,
          name: 'NESCAFÉ Espresso 1kg',
          description: 'Gondosan válogatott kávébabokból készült.',
          price: '8.490 Ft',
          image: 'assets/images/nescafe-original.jpg'
        },
        {
          id: 2,
          name: 'NESCAFÉ Espresso 1kg',
          description: 'Gondosan válogatott kávébabokból készült.',
          price: '8.490 Ft',
          image: 'assets/images/instant-coffee-jar.jpg'
        },
        {
          id: 3,
          name: 'NESCAFÉ Espresso 1kg',
          description: 'Gondosan válogatott kávébabokból készült.',
          price: '8.490 Ft',
          image: 'assets/images/espresso-jar.jpg'
        }
      ];
}
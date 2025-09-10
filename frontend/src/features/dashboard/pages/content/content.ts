import { Component, OnInit, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DashboardHeader } from '@shared/ui/dashboard-header/dashboard-header';
import { Graphql } from '../../../../core/graphql.service';

interface SiteContent {
  id: string;
  heroTitle: string;
  heroSubtitle: string;
  aboutTitle: string;
  aboutBody: string;
}

@Component({
  selector: 'page-content',
  standalone: true,
  imports: [DashboardHeader, NgIf, ReactiveFormsModule],
  templateUrl: './content.html',
  styleUrls: ['./content.scss'],
})
export class Content implements OnInit {
  contentForm: FormGroup;
  loading = signal<boolean>(true);
  saving = signal<boolean>(false);
  success = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor(private fb: FormBuilder, private gql: Graphql, private router: Router) {
    this.contentForm = this.fb.group({
      heroTitle: ['', [Validators.required, Validators.maxLength(200)]],
      heroSubtitle: ['', [Validators.required, Validators.maxLength(300)]],
      aboutTitle: ['', [Validators.required, Validators.maxLength(200)]],
      aboutBody: ['', [Validators.required, Validators.maxLength(2000)]]
    });
  }

  ngOnInit() {
    this.loadContent();
  }

  async loadContent() {
    this.loading.set(true);
    this.error.set(null);

    const QUERY = /* GraphQL */ `
      query SiteContent {
        siteContent {
          id
          heroTitle
          heroSubtitle
          aboutTitle
          aboutBody
        }
      }
    `;

    try {
      const data = await this.gql.query<{ siteContent: SiteContent | null }>(QUERY);
      if (data.siteContent) {
        this.contentForm.patchValue({
          heroTitle: data.siteContent.heroTitle || '',
          heroSubtitle: data.siteContent.heroSubtitle || '',
          aboutTitle: data.siteContent.aboutTitle || '',
          aboutBody: data.siteContent.aboutBody || ''
        });
      }
    } catch (e: any) {
      this.error.set(e?.message || 'Hiba a tartalom betöltése során');
    } finally {
      this.loading.set(false);
    }
  }

  async onSubmit() {
    this.success.set(false);
    this.error.set(null);

    if (!this.contentForm.valid) {
      this.contentForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    const MUTATION = /* GraphQL */ `
      mutation UpdateSiteContent($heroTitle: String, $heroSubtitle: String, $aboutTitle: String, $aboutBody: String) {
        updateSiteContent(heroTitle: $heroTitle, heroSubtitle: $heroSubtitle, aboutTitle: $aboutTitle, aboutBody: $aboutBody) {
          success
          siteContent {
            id
            heroTitle
            heroSubtitle
            aboutTitle
            aboutBody
          }
        }
      }
    `;

    try {
      const formData = this.contentForm.value;
      const result = await this.gql.mutate<{ 
        updateSiteContent: { 
          success: boolean; 
          siteContent: SiteContent 
        } 
      }>(MUTATION, {
        heroTitle: formData.heroTitle,
        heroSubtitle: formData.heroSubtitle,
        aboutTitle: formData.aboutTitle,
        aboutBody: formData.aboutBody
      });

      if (result.updateSiteContent.success) {
        this.success.set(true);
        // Navigate back to dashboard after 1 second
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1000);
      } else {
        this.error.set('A tartalom mentése nem sikerült');
      }
    } catch (e: any) {
      console.error('Content save error:', e);
      this.error.set(e?.message || 'Hiba a tartalom mentése során');
    } finally {
      this.saving.set(false);
    }
  }

  get canSubmit(): boolean {
    return this.contentForm.valid && !this.saving();
  }
}

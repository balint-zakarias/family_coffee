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
  heroImageUrl: string | null;
  aboutTitle: string;
  aboutBody: string;
  aboutImageUrl: string | null;
  webshopImageUrl: string | null;
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

  // Image files and preview URLs
  heroImageFile: File | null = null;
  aboutImageFile: File | null = null;
  webshopImageFile: File | null = null;
  heroImagePreview: string | null = null;
  aboutImagePreview: string | null = null;
  webshopImagePreview: string | null = null;

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
          heroImageUrl
          aboutTitle
          aboutBody
          aboutImageUrl
          webshopImageUrl
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
        
        // Set image previews
        this.heroImagePreview = data.siteContent.heroImageUrl;
        this.aboutImagePreview = data.siteContent.aboutImageUrl;
        this.webshopImagePreview = data.siteContent.webshopImageUrl;
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
      mutation UpdateSiteContent($heroTitle: String, $heroSubtitle: String, $aboutTitle: String, $aboutBody: String, $heroImage: Upload, $aboutImage: Upload, $webshopImage: Upload) {
        updateSiteContent(heroTitle: $heroTitle, heroSubtitle: $heroSubtitle, aboutTitle: $aboutTitle, aboutBody: $aboutBody, heroImage: $heroImage, aboutImage: $aboutImage, webshopImage: $webshopImage) {
          success
          siteContent {
            id
            heroTitle
            heroSubtitle
            heroImageUrl
            aboutTitle
            aboutBody
            aboutImageUrl
            webshopImageUrl
          }
        }
      }
    `;

    try {
      const formData = this.contentForm.value;
      const variables: any = {
        heroTitle: formData.heroTitle,
        heroSubtitle: formData.heroSubtitle,
        aboutTitle: formData.aboutTitle,
        aboutBody: formData.aboutBody
      };

      // Add image files if present
      if (this.heroImageFile) variables.heroImage = this.heroImageFile;
      if (this.aboutImageFile) variables.aboutImage = this.aboutImageFile;
      if (this.webshopImageFile) variables.webshopImage = this.webshopImageFile;

      const result = await (this.heroImageFile || this.aboutImageFile || this.webshopImageFile 
        ? this.gql.mutateMultipart(MUTATION, variables)
        : this.gql.mutate(MUTATION, variables)) as { 
        updateSiteContent: { 
          success: boolean; 
          siteContent: SiteContent 
        } 
      };

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

  onHeroImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.heroImageFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.heroImagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onAboutImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.aboutImageFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.aboutImagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onWebshopImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.webshopImageFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.webshopImagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onImageError(event: any) {
    event.target.style.display = 'none';
  }
}

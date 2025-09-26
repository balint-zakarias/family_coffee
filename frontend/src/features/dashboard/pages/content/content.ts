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
  heroButtonText: string;
  heroButtonUrl: string;
  heroImageUrl: string | null;
  heroImageUrlMobile: string | null;
  aboutTitle: string;
  aboutSubtitle: string;
  aboutBody: string;
  aboutImageUrl: string | null;
  aboutImageUrlMobile: string | null;
  webshopImageUrl: string | null;
  webshopImageUrlMobile: string | null;
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
  heroImageMobileFile: File | null = null;
  aboutImageFile: File | null = null;
  aboutImageMobileFile: File | null = null;
  webshopImageFile: File | null = null;
  webshopImageMobileFile: File | null = null;
  heroImagePreview: string | null = null;
  heroImageMobilePreview: string | null = null;
  aboutImagePreview: string | null = null;
  aboutImageMobilePreview: string | null = null;
  webshopImagePreview: string | null = null;
  webshopImageMobilePreview: string | null = null;

  constructor(private fb: FormBuilder, private gql: Graphql, private router: Router) {
    this.contentForm = this.fb.group({
      heroTitle: ['', [Validators.required, Validators.maxLength(200)]],
      heroSubtitle: ['', [Validators.required, Validators.maxLength(300)]],
      heroButtonText: ['', [Validators.maxLength(60)]],
      heroButtonUrl: ['', [Validators.maxLength(200)]],
      aboutTitle: ['', [Validators.required, Validators.maxLength(200)]],
      aboutSubtitle: ['', [Validators.maxLength(240)]],
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
          heroButtonText
          heroButtonUrl
          heroImageUrl
          heroImageUrlMobile
          aboutTitle
          aboutSubtitle
          aboutBody
          aboutImageUrl
          aboutImageUrlMobile
          webshopImageUrl
          webshopImageUrlMobile
        }
      }
    `;

    try {
      const data = await this.gql.query<{ siteContent: SiteContent | null }>(QUERY);
      if (data.siteContent) {
        this.contentForm.patchValue({
          heroTitle: data.siteContent.heroTitle || '',
          heroSubtitle: data.siteContent.heroSubtitle || '',
          heroButtonText: data.siteContent.heroButtonText || '',
          heroButtonUrl: data.siteContent.heroButtonUrl || '',
          aboutTitle: data.siteContent.aboutTitle || '',
          aboutSubtitle: data.siteContent.aboutSubtitle || '',
          aboutBody: data.siteContent.aboutBody || ''
        });
        
        // Set image previews
        this.heroImagePreview = data.siteContent.heroImageUrl;
        this.heroImageMobilePreview = data.siteContent.heroImageUrlMobile;
        this.aboutImagePreview = data.siteContent.aboutImageUrl;
        this.aboutImageMobilePreview = data.siteContent.aboutImageUrlMobile;
        this.webshopImagePreview = data.siteContent.webshopImageUrl;
        this.webshopImageMobilePreview = data.siteContent.webshopImageUrlMobile;
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
      mutation UpdateSiteContent($heroTitle: String, $heroSubtitle: String, $heroButtonText: String, $heroButtonUrl: String, $aboutTitle: String, $aboutSubtitle: String, $aboutBody: String, $heroImage: Upload, $heroImageMobile: Upload, $aboutImage: Upload, $aboutImageMobile: Upload, $webshopImage: Upload, $webshopImageMobile: Upload) {
        updateSiteContent(heroTitle: $heroTitle, heroSubtitle: $heroSubtitle, heroButtonText: $heroButtonText, heroButtonUrl: $heroButtonUrl, aboutTitle: $aboutTitle, aboutSubtitle: $aboutSubtitle, aboutBody: $aboutBody, heroImage: $heroImage, heroImageMobile: $heroImageMobile, aboutImage: $aboutImage, aboutImageMobile: $aboutImageMobile, webshopImage: $webshopImage, webshopImageMobile: $webshopImageMobile) {
          success
          siteContent {
            id
            heroTitle
            heroSubtitle
            heroButtonText
            heroButtonUrl
            heroImageUrl
            heroImageUrlMobile
            aboutTitle
            aboutSubtitle
            aboutBody
            aboutImageUrl
            aboutImageUrlMobile
            webshopImageUrl
            webshopImageUrlMobile
          }
        }
      }
    `;

    try {
      const formData = this.contentForm.value;
      const variables: any = {
        heroTitle: formData.heroTitle,
        heroSubtitle: formData.heroSubtitle,
        heroButtonText: formData.heroButtonText,
        heroButtonUrl: formData.heroButtonUrl,
        aboutTitle: formData.aboutTitle,
        aboutSubtitle: formData.aboutSubtitle,
        aboutBody: formData.aboutBody
      };

      // Add image files if present
      if (this.heroImageFile) variables.heroImage = this.heroImageFile;
      if (this.heroImageMobileFile) variables.heroImageMobile = this.heroImageMobileFile;
      if (this.aboutImageFile) variables.aboutImage = this.aboutImageFile;
      if (this.aboutImageMobileFile) variables.aboutImageMobile = this.aboutImageMobileFile;
      if (this.webshopImageFile) variables.webshopImage = this.webshopImageFile;
      if (this.webshopImageMobileFile) variables.webshopImageMobile = this.webshopImageMobileFile;

      const result = await (this.heroImageFile || this.heroImageMobileFile || this.aboutImageFile || this.aboutImageMobileFile || this.webshopImageFile || this.webshopImageMobileFile 
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

  onHeroImageMobileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.heroImageMobileFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.heroImageMobilePreview = e.target?.result as string;
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

  onAboutImageMobileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.aboutImageMobileFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.aboutImageMobilePreview = e.target?.result as string;
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

  onWebshopImageMobileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.webshopImageMobileFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.webshopImageMobilePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onImageError(event: any) {
    event.target.style.display = 'none';
  }
}

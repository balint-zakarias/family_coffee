import { Component, OnInit, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DashboardHeader } from '@shared/ui/dashboard-header/dashboard-header';
import { Graphql } from '../../../../core/graphql.service';

interface SiteSettings {
  id: string;
  merchantOrderEmail: string;
}

@Component({
  selector: 'page-settings',
  standalone: true,
  imports: [DashboardHeader, NgIf, ReactiveFormsModule],
  templateUrl: './settings.html',
  styleUrls: ['./settings.scss'],
})
export class Settings implements OnInit {
  settingsForm: FormGroup;
  loading = signal<boolean>(true);
  saving = signal<boolean>(false);
  success = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor(private fb: FormBuilder, private gql: Graphql) {
    this.settingsForm = this.fb.group({
      merchantOrderEmail: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit() {
    this.loadSettings();
  }

  async loadSettings() {
    this.loading.set(true);
    this.error.set(null);

    const QUERY = /* GraphQL */ `
      query SiteSettings {
        siteSettings {
          id
          merchantOrderEmail
        }
      }
    `;

    try {
      const data = await this.gql.query<{ siteSettings: SiteSettings | null }>(QUERY);
      if (data.siteSettings) {
        this.settingsForm.patchValue({
          merchantOrderEmail: data.siteSettings.merchantOrderEmail || ''
        });
      }
    } catch (e: any) {
      this.error.set(e?.message || 'Hiba a beállítások betöltése során');
    } finally {
      this.loading.set(false);
    }
  }

  async onSubmit() {
    this.success.set(false);
    this.error.set(null);

    if (!this.settingsForm.valid) {
      this.settingsForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    const MUTATION = /* GraphQL */ `
      mutation UpdateSiteSettings($merchantOrderEmail: String) {
        updateSiteSettings(merchantOrderEmail: $merchantOrderEmail) {
          success
          siteSettings {
            id
            merchantOrderEmail
          }
        }
      }
    `;

    try {
      const formData = this.settingsForm.value;
      console.log('Sending mutation with data:', formData);
      
      const result = await this.gql.mutate<{ 
        updateSiteSettings: { 
          success: boolean; 
          siteSettings: SiteSettings 
        } 
      }>(MUTATION, {
        merchantOrderEmail: formData.merchantOrderEmail || null
      });

      console.log('Mutation result:', result);

      if (result.updateSiteSettings.success) {
        this.success.set(true);
        setTimeout(() => this.success.set(false), 3000);
      } else {
        this.error.set('A beállítások mentése nem sikerült');
      }
    } catch (e: any) {
      console.error('Settings save error:', e);
      this.error.set(e?.message || 'Hiba a beállítások mentése során');
    } finally {
      this.saving.set(false);
    }
  }

  get canSubmit(): boolean {
    return this.settingsForm.valid && !this.saving();
  }
}

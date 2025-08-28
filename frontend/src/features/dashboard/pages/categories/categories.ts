import { Component, OnInit, signal } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DashboardHeader } from '@shared/ui/dashboard-header/dashboard-header';
import { ConfirmationModal } from '@shared/ui/confirmation-modal/confirmation-modal';
import { Graphql } from '../../../../core/graphql.service';

interface Category {
  id: string;
  name: string;
  slug: string;
}

@Component({
  selector: 'page-categories',
  standalone: true,
  imports: [DashboardHeader, ConfirmationModal, NgIf, NgFor, ReactiveFormsModule],
  templateUrl: './categories.html',
  styleUrls: ['./categories.scss'],
})
export class Categories implements OnInit {
  categories = signal<Category[]>([]);
  categoryForm: FormGroup;
  loading = signal<boolean>(true);
  saving = signal<boolean>(false);
  success = signal<boolean>(false);
  error = signal<string | null>(null);
  editingId = signal<string | null>(null);

  // Modal state
  showDeleteModal = signal<boolean>(false);
  categoryToDelete = signal<Category | null>(null);

  constructor(private fb: FormBuilder, private gql: Graphql) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(120)]]
    });
  }

  ngOnInit() {
    this.loadCategories();
  }

  async loadCategories() {
    this.loading.set(true);
    this.error.set(null);

    const QUERY = /* GraphQL */ `
      query Categories {
        categories {
          id
          name
          slug
        }
      }
    `;

    try {
      const data = await this.gql.query<{ categories: Category[] }>(QUERY);
      this.categories.set(data.categories || []);
    } catch (e: any) {
      this.error.set(e?.message || 'Hiba a kategóriák betöltése során');
    } finally {
      this.loading.set(false);
    }
  }

  async onSubmit() {
    this.success.set(false);
    this.error.set(null);

    if (!this.categoryForm.valid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    const formData = this.categoryForm.value;
    const isEditing = this.editingId();

    try {
      if (isEditing) {
        await this.updateCategory(isEditing, formData.name);
      } else {
        await this.createCategory(formData.name);
      }

      this.success.set(true);
      setTimeout(() => this.success.set(false), 3000);
      
      this.categoryForm.reset();
      this.editingId.set(null);
      await this.loadCategories();
    } catch (e: any) {
      this.error.set(e?.message || 'Hiba a kategória mentése során');
    } finally {
      this.saving.set(false);
    }
  }

  private async createCategory(name: string) {
    const MUTATION = /* GraphQL */ `
      mutation CreateCategory($name: String!) {
        createCategory(name: $name) {
          success
          category {
            id
            name
            slug
          }
        }
      }
    `;

    const result = await this.gql.mutate<{ 
      createCategory: { success: boolean; category: Category } 
    }>(MUTATION, { name });

    if (!result.createCategory.success) {
      throw new Error('A kategória létrehozása nem sikerült');
    }
  }

  private async updateCategory(id: string, name: string) {
    const MUTATION = /* GraphQL */ `
      mutation UpdateCategory($id: Int!, $name: String!) {
        updateCategory(id: $id, name: $name) {
          success
          category {
            id
            name
            slug
          }
        }
      }
    `;

    const result = await this.gql.mutate<{ 
      updateCategory: { success: boolean; category: Category } 
    }>(MUTATION, { id: parseInt(id), name });

    if (!result.updateCategory.success) {
      throw new Error('A kategória frissítése nem sikerült');
    }
  }

  openDeleteModal(category: Category) {
    this.categoryToDelete.set(category);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.categoryToDelete.set(null);
  }

  async confirmDelete() {
    const category = this.categoryToDelete();
    if (!category) return;

    this.error.set(null);

    const MUTATION = /* GraphQL */ `
      mutation DeleteCategory($id: Int!) {
        deleteCategory(id: $id) {
          success
        }
      }
    `;

    try {
      const result = await this.gql.mutate<{ 
        deleteCategory: { success: boolean } 
      }>(MUTATION, { id: parseInt(category.id) });

      if (result.deleteCategory.success) {
        this.closeDeleteModal();
        await this.loadCategories();
      } else {
        this.closeDeleteModal();
        this.error.set('A kategória törlése nem sikerült');
      }
    } catch (e: any) {
      this.closeDeleteModal();
      this.error.set(e?.message || 'Hiba a kategória törlése során');
    }
  }

  editCategory(category: Category) {
    this.editingId.set(category.id);
    this.categoryForm.patchValue({ name: category.name });
  }

  cancelEdit() {
    this.editingId.set(null);
    this.categoryForm.reset();
  }

  get canSubmit(): boolean {
    return this.categoryForm.valid && !this.saving();
  }

  get isEditing(): boolean {
    return this.editingId() !== null;
  }
}

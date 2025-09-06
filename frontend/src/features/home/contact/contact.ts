import { Component, EventEmitter, Output } from '@angular/core';
import { NgIf } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Graphql } from '../../../core/graphql.service';

// ---- cross-field validator: legalább egy kitöltve az email/telefon közül
function atLeastOneEmailOrPhone(group: AbstractControl): ValidationErrors | null {
  const email = group.get('email')?.value?.trim();
  const phone = group.get('phone')?.value?.trim();
  return (email || phone) ? null : { atLeastOne: true };
}

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [NgIf, ReactiveFormsModule],
  templateUrl: './contact.html',
  styleUrls: ['./contact.scss']
})
export class Contact {
  @Output() submitted = new EventEmitter<{
    name: string;
    email?: string;
    phone?: string;
    message: string;
    accepted: boolean;
  }>();

  form: FormGroup;
  loading = false;
  success = false;
  error: string | null = null;

  private readonly MUTATION = /* GraphQL */ `
    mutation CreateContactMessage($name: String!, $message: String!, $email: String, $phone: String) {
      createContactMessage(name: $name, message: $message, email: $email, phone: $phone) {
        contactMessage { id }
      }
    }
  `;

  constructor(private fb: FormBuilder, private gql: Graphql) {
    this.form = this.fb.group(
      {
        name: ['', [Validators.required, Validators.maxLength(160)]],
        email: ['', [Validators.email]],
        phone: [''],
        message: ['', [Validators.required]],
        accepted: [false, [Validators.requiredTrue]],
      },
      { validators: atLeastOneEmailOrPhone } 
    );
  }

  get canSubmit(): boolean {
    return this.form.valid && !this.loading;
  }

  async onSubmit() {
    this.success = false;
    this.error = null;

    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, email, phone, message, accepted } = this.form.value as {
      name: string; email?: string; phone?: string; message: string; accepted: boolean;
    };

    this.loading = true;
    try {
      await this.gql.query<{ createContactMessage: { contactMessage: { id: string } } }>(
        this.MUTATION,
        { name, message, email: email || null, phone: phone || null }
      );

      this.submitted.emit({ name, email, phone, message, accepted });

      this.success = true;
      setTimeout(() => {
        this.success = false;
      }, 3000);
      this.form.reset({ accepted: false });
    } catch (e: any) {
      this.error = e?.message ?? String(e);
    } finally {
      this.loading = false;
    }
  }
}
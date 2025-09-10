import { Component, OnInit, signal } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { DashboardHeader } from '@shared/ui/dashboard-header/dashboard-header';
import { ConfirmationModal } from '@shared/ui/confirmation-modal/confirmation-modal';
import { Graphql } from '../../../../core/graphql.service';
import { MatIconModule } from '@angular/material/icon';

interface ContactMessage {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  handled: boolean;
  createdAt: string;
}

@Component({
  selector: 'page-contact-forms',
  standalone: true,
  imports: [DashboardHeader, ConfirmationModal, NgIf, NgFor, DatePipe, MatIconModule],
  templateUrl: './contact-forms.html',
  styleUrls: ['./contact-forms.scss'],
})
export class ContactForms implements OnInit {
  contactMessages = signal<ContactMessage[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  
  // Delete modal state
  showDeleteModal = signal<boolean>(false);
  messageToDelete = signal<ContactMessage | null>(null);

  constructor(private gql: Graphql) {}

  ngOnInit() {
    this.loadContactMessages();
  }

  async loadContactMessages() {
    this.loading.set(true);
    this.error.set(null);

    const QUERY = /* GraphQL */ `
      query GetContactMessages {
        contactMessages {
          id
          name
          email
          phone
          message
          handled
          createdAt
        }
      }
    `;

    try {
      const data = await this.gql.query<{ contactMessages: ContactMessage[] }>(QUERY);
      this.contactMessages.set(data.contactMessages || []);
    } catch (e: any) {
      this.error.set(e?.message || 'Hiba a kapcsolat üzenetek betöltése során');
    } finally {
      this.loading.set(false);
    }
  }

  openDeleteModal(message: ContactMessage) {
    this.messageToDelete.set(message);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.messageToDelete.set(null);
  }

  async confirmDelete() {
    const message = this.messageToDelete();
    if (!message) return;

    const MUTATION = /* GraphQL */ `
      mutation DeleteContactMessage($id: ID!) {
        deleteContactMessage(id: $id) {
          success
        }
      }
    `;

    try {
      const result = await this.gql.mutate<{ deleteContactMessage: { success: boolean } }>(
        MUTATION,
        { id: message.id.toString() }
      );

      if (result.deleteContactMessage.success) {
        this.contactMessages.update(messages => 
          messages.filter(msg => msg.id !== message.id)
        );
        this.closeDeleteModal();
      }
    } catch (e: any) {
      this.closeDeleteModal();
      this.error.set(e?.message || 'Hiba az üzenet törlése során');
    }
  }

  getContactInfo(message: ContactMessage): string {
    if (message.email && message.phone) {
      return `${message.email} • ${message.phone}`;
    }
    return message.email || message.phone || 'Nincs elérhetőség';
  }
}

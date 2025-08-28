import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [NgIf],
  templateUrl: './confirmation-modal.html',
  styleUrls: ['./confirmation-modal.scss'],
})
export class ConfirmationModal {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() message = '';
  @Input() confirmText = 'Igen';
  @Input() cancelText = 'Mégse';
  @Input() isDangerous = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }
}

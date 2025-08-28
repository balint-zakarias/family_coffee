import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DecimalPipe, NgIf } from '@angular/common';

export type UiProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  description?: string | null;
  imageUrl?: string | null;
};

@Component({
  selector: 'ui-product-card',
  standalone: true,
  imports: [DecimalPipe, NgIf],
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.scss']
})
export class ProductCard {
  @Input({ required: true }) product!: UiProduct;

  // Események a szülőnek
  @Output() addToCart   = new EventEmitter<UiProduct>();
  @Output() viewDetails = new EventEmitter<UiProduct>();

  // (Opcionális) callback-ek Inputként 
  @Input() onAdd?: (p: UiProduct) => void;
  @Input() onDetails?: (p: UiProduct) => void;

  handleAdd() {
    // Először az Output esemény
    this.addToCart.emit(this.product);
    // Ha kaptunk callback-et Inputon, azt is hívjuk
    this.onAdd?.(this.product);
  }

  handleDetails() {
    this.viewDetails.emit(this.product);
    this.onDetails?.(this.product);
  }
}
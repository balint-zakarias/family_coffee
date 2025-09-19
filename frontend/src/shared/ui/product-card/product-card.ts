import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DecimalPipe, NgIf } from '@angular/common';

export type UiProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  description?: string | null;
  imageUrl?: string | null;
  onlyForRent?: boolean;
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
  @Input() globalDisabled = false; // Globális letiltás állapot

  // Események a szülőnek
  @Output() addToCart   = new EventEmitter<UiProduct>();
  @Output() viewDetails = new EventEmitter<UiProduct>();

  // (Opcionális) callback-ek Inputként 
  @Input() onAdd?: (p: UiProduct) => void;
  @Input() onDetails?: (p: UiProduct) => void;

  showSuccess = false;

  get isDisabled() {
    return this.showSuccess || this.globalDisabled;
  }

  handleAdd() {
    if (this.isDisabled) return;
    
    // Animáció indítása
    this.showSuccess = true;
    
    // Először az Output esemény
    this.addToCart.emit(this.product);
    // Ha kaptunk callback-et Inputon, azt is hívjuk
    this.onAdd?.(this.product);

    // Animáció elrejtése 2 másodperc után
    setTimeout(() => {
      this.showSuccess = false;
    }, 2000);
  }

  handleDetails() {
    if (this.isDisabled) return;
    
    this.viewDetails.emit(this.product);
    this.onDetails?.(this.product);
  }
}
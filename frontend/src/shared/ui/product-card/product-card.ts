import { Component, Input } from '@angular/core';
import { DecimalPipe, NgIf } from '@angular/common';

export type UiProduct = {
  name: string;
  price: number;
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
}
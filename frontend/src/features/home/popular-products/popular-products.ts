import { Component, Input } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  imageUrl: string | null;
};

@Component({
  selector: 'app-popular-products',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink],
  templateUrl: './popular-products.html',
  styleUrls: ['./popular-products.scss']
})
export class PopularProducts {
  @Input() products: Product[] = [];
}
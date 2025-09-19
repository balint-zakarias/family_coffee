export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  image: string | null;
  imageUrl: string | null;
  category: {
    id: number;
    name: string;
    slug: string;
  } | null;
  categorySlug: string | null;
  sku: string;
  ean: string;
  eanCarton: string;
  neta: number;
  vat: number;
  stockQty: number;
  isActive: boolean;
  onlyForRent: boolean;
  createdAt: string;
  updatedAt: string;
  images: ProductImage[];
}

export interface ProductImage {
  id: number;
  image: string;
  alt: string;
  ordering: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: number;
  name: string;
  unitPrice: number;
  qty: number;
  imageUrl: string;
  subtitle?: string;
}

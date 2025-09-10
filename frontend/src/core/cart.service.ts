import { Injectable, signal } from '@angular/core';
import { Graphql } from './graphql.service';

type GqlMoney = string;

type UiCartItem = {
  id: string;
  quantity: number;
  unit_price_snapshot: GqlMoney;
  line_total: GqlMoney;
  product: { id: string; name: string; imageUrl?: string | null; price: GqlMoney };
};
type UiCart = { items: UiCartItem[]; subtotal: GqlMoney };

@Injectable({ providedIn: 'root' })
export class CartService {
  loading = signal(false);
  readonly count = signal<number>(0);
  cart = signal<UiCart | null>(null);
  private _loadedCountOnce = false;

  constructor(private gql: Graphql) {}

  private recomputeCountFromCart(c: UiCart | null) {
    const n = c ? c.items.reduce((s, it) => s + it.quantity, 0) : 0;
    this.count.set(n);
    return n;
  }

  async loadCountOnce() {
    if (this._loadedCountOnce) return;
    await this.refreshCount();
    this._loadedCountOnce = true;
  }

  async refreshCount() {
    const QUERY = /* GraphQL */ `query CartSummary { cartSummary { count } }`;
    const data = await this.gql.query<{ cartSummary: { count: number } }>(QUERY);
    this.count.set(data.cartSummary?.count ?? 0);
  }

  async fetch(): Promise<{ cart: UiCart | null; count: number }> {
    this.loading.set(true);
    const Q = `
      query {
        cart {
          subtotal
          items {
            id
            quantity
            unitPriceSnapshot
            lineTotal
            product { id name imageUrl price }
          }
        }
      }
    `;
    try {
      const data = await this.gql.query<{ cart: UiCart | null }>(Q);
      const cart = data.cart ?? null;
  
      this.cart.set(cart);
      const count = this.recomputeCountFromCart(cart);
      return { cart, count };
    } finally {
      this.loading.set(false);
    }
  }

  async add(productId: string, qty = 1) {
    const M = `
      mutation($pid: ID!, $q: Int!) {
        addToCart(productId: $pid, quantity: $q) {
          cart {
            subtotal
            items {
              id quantity unitPriceSnapshot lineTotal
              product { id name imageUrl price }
            }
          }
        }
      }
    `;
    const data = await this.gql.mutate<{ addToCart: { cart: UiCart } }>(M, { pid: productId, q: qty });
    this.cart.set(data.addToCart.cart);
    this.recomputeCountFromCart(data.addToCart.cart);
  }

  async setQty(productId: string, qty: number) {
    const M = `
      mutation($productId: ID!, $quantity: Int!) {
        updateCartItem(productId: $productId, quantity: $quantity) {
          cart {
            subtotal
            items {
              id quantity unitPriceSnapshot lineTotal
              product { id name imageUrl price }
            }
          }
        }
      }
    `;
    const data = await this.gql.mutate<{ updateCartItem: { cart: UiCart } }>(M, { productId, quantity: qty });
    this.cart.set(data.updateCartItem.cart);
    this.recomputeCountFromCart(data.updateCartItem.cart);
  }

  async remove(itemId: string) {
    const M = `
      mutation($id: ID!) {
        removeFromCart(productId: $id) {
          cart {
            subtotal
            items {
              id quantity unitPriceSnapshot lineTotal
              product { id name imageUrl price }
            }
          }
        }
      }
    `;
    const data = await this.gql.mutate<{ removeFromCart: { cart: UiCart } }>(M, { id: itemId });
    this.cart.set(data.removeFromCart.cart);
    this.recomputeCountFromCart(data.removeFromCart.cart);
  }
}
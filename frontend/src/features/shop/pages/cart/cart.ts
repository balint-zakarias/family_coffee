import { Component, signal, computed } from '@angular/core';
import { NgFor, NgIf, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CartService } from 'core/cart.service';
import { Graphql } from '../../../../core/graphql.service';

type UiCartItem = {
  id: number;
  name: string;
  imageUrl: string;
  unitPrice: number;   // Ft
  qty: number;
  subtitle?: string;   // pl. „1 x 89.990 Ft”
};

type GqlProduct = {
  id: string;
  name: string;
  imageUrl: string | null;   // Graphene: image_url -> imageUrl
  price: string;             // Decimal string
};

type GqlCartItem = {
  id: string;
  quantity: number;
  unitPriceSnapshot: string; // Decimal string
  product: GqlProduct;
};

type GqlCart = {
  id: string;
  items: GqlCartItem[];
};

@Component({
  selector: 'page-cart',
  standalone: true,
  imports: [NgFor, NgIf, DecimalPipe, ReactiveFormsModule],
  templateUrl: './cart.html',
  styleUrls: ['./cart.scss']
})

export class Cart {
  loading = signal<boolean>(false);
  error   = signal<string | null>(null);
  items = signal<UiCartItem[]>([]);
  readonly deleteIcon = signal('/assets/trashcan.png');

  // Order form
  orderForm: FormGroup;
  orderLoading = signal<boolean>(false);
  orderSuccess = signal<boolean>(false);
  orderError = signal<string | null>(null);

  private pending = signal<Set<number>>(new Set());
  isPending = (id: number) => this.pending().has(id);
  private setPending(id: number, on: boolean) {
    this.pending.update(s => {
      const next = new Set(s);
      on ? next.add(id) : next.delete(id);
      return next;
    });
  }

  constructor(private cartService: CartService, private fb: FormBuilder, private gql: Graphql) {
    this.orderForm = this.fb.group({
      customerName: ['', [Validators.required, Validators.maxLength(160)]],
      customerEmail: ['', [Validators.email]],
      customerPhone: ['', [Validators.required]],
      shippingAddress: ['', [Validators.required, Validators.maxLength(300)]],
      shippingCity: ['', [Validators.required, Validators.maxLength(120)]],
      shippingZip: ['', [Validators.required, Validators.maxLength(20)]],
      deliveryNotes: ['', [Validators.maxLength(300)]],
      acceptedPolicy: [false, [Validators.requiredTrue]]
    });

    this.cartService
      .fetch()
      .then(({ cart }) => {
        this.items.set(this.mapToUi((cart?.items ?? []) as unknown as GqlCartItem[]));
      })
      .catch(e => this.error.set(String(e?.message || e)));
  }

  // ---- Helpers ----
  private fmtSubtitle(qty: number, unitPrice: number) {
    // csak a vizuális string; a sablonban az ár úgyis pipelve van
    const parts = unitPrice.toLocaleString('hu-HU');
    return `${qty} x ${parts} Ft`;
  }

  private readonly NO_IMG = 'https://via.placeholder.com/150?text=No+Image';

  private mapToUi(items: GqlCartItem[]): UiCartItem[] {
    return items.map(it => {
      const unit = Number(it.unitPriceSnapshot ?? it.product?.price ?? 0);
      const img =
        it.product?.imageUrl && it.product.imageUrl.trim() !== ''
          ? it.product.imageUrl
          : this.NO_IMG;
  
      return {
        id: Number(it.id),
        name: it.product?.name ?? 'Ismeretlen termék',
        imageUrl: img,
        unitPrice: unit,
        qty: it.quantity,
        subtitle: this.fmtSubtitle(it.quantity, unit),
      };
    });
  }

  async loadCart() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const { cart } = await this.cartService.fetch();
      this.items.set(this.mapToUi((cart?.items ?? []) as unknown as GqlCartItem[]));
    } catch (e: any) {
      this.error.set(String(e?.message || e));
    } finally {
      this.loading.set(false);
    }
  }

  total = computed(() =>
    this.items().reduce((sum, it) => sum + it.unitPrice * it.qty, 0)
  );

  async inc(id: number) {
    const it = this.items().find(i => i.id === id);
    if (!it) return;
    this.setPending(id, true);
    try {
      await this.cartService.setQty(String(id), it.qty + 1);
      const c = this.cartService.cart();
      this.items.set(this.mapToUi(((c?.items ?? []) as unknown) as GqlCartItem[]));
    } catch (e: any) {
      this.error.set(String(e?.message || e));
    } finally {
      this.setPending(id, false);
    }
  }
  
  async dec(id: number) {
    const it = this.items().find(i => i.id === id);
    if (!it) return;
    const next = Math.max(1, it.qty - 1);
    this.setPending(id, true);
    try {
      await this.cartService.setQty(String(id), next);
      const c = this.cartService.cart();
      this.items.set(this.mapToUi(((c?.items ?? []) as unknown) as GqlCartItem[]));
    } catch (e: any) {
      this.error.set(String(e?.message || e));
    } finally {
      this.setPending(id, false);
    }
  }
  
  async remove(id: number) {
    this.setPending(id, true);
    try {
      await this.cartService.remove(String(id));
      const c = this.cartService.cart();
      this.items.set(this.mapToUi(((c?.items ?? []) as unknown) as GqlCartItem[]));
    } catch (e: any) {
      this.error.set(String(e?.message || e));
    } finally {
      this.setPending(id, false);
    }
  }

  trackById(index: number, item: UiCartItem) { return item.id; }

  async onSubmitOrder() {
    this.orderSuccess.set(false);
    this.orderError.set(null);

    if (!this.orderForm.valid) {
      this.orderForm.markAllAsTouched();
      return;
    }

    if (this.items().length === 0) {
      this.orderError.set('A kosár üres');
      return;
    }

    this.orderLoading.set(true);

    const MUTATION = /* GraphQL */ `
      mutation CreateOrder($input: OrderInput!) {
        createOrder(input: $input) {
          order {
            id
            customerName
            grandTotal
          }
        }
      }
    `;

    try {
      const formData = this.orderForm.value;
      const orderInput = {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail || null,
        customerPhone: formData.customerPhone,
        shippingAddress: formData.shippingAddress,
        shippingCity: formData.shippingCity,
        shippingZip: formData.shippingZip,
        deliveryNotes: formData.deliveryNotes || '',
        grandTotal: this.total()
      };

      await this.gql.mutate(MUTATION, { input: orderInput });

      this.orderSuccess.set(true);
      setTimeout(() => this.orderSuccess.set(false), 3000);
      
      // Clear cart and form
      this.items.set([]);
      this.orderForm.reset({ acceptedPolicy: false });
      
    } catch (e: any) {
      this.orderError.set(e?.message || 'Hiba történt a rendelés leadása során');
    } finally {
      this.orderLoading.set(false);
    }
  }

  get canSubmitOrder(): boolean {
    return this.orderForm.valid && !this.orderLoading() && this.items().length > 0;
  }
}

import { Component, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CartService } from 'core/cart.service';
import { Graphql } from '../../../core/graphql.service';

type UiCartItem = {
  id: number;
  productId: string; // Termék ID a backend számára
  name: string;
  imageUrl: string;
  unitPrice: number;
  qty: number;
  subtitle?: string;
};

type GqlProduct = {
  id: string;
  name: string;
  imageUrl: string | null;
  price: string;
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
  imports: [DecimalPipe, ReactiveFormsModule, MatIconModule],
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

  ngOnInit() {
    this.orderForm.get('differentDeliveryAddress')?.valueChanges.subscribe((checked: boolean) => {
      const shippingAddress = this.orderForm.get('shippingAddress');
      const shippingCity = this.orderForm.get('shippingCity');
      const shippingZip = this.orderForm.get('shippingZip');
  
      if (checked) {
        shippingAddress?.setValidators([Validators.required, Validators.maxLength(300)]);
        shippingCity?.setValidators([Validators.required, Validators.maxLength(120)]);
        shippingZip?.setValidators([Validators.required, Validators.maxLength(20)]);
      } else {
        shippingAddress?.clearValidators();
        shippingCity?.clearValidators();
        shippingZip?.clearValidators();
        shippingAddress?.setValue('');
        shippingCity?.setValue('');
        shippingZip?.setValue('');
      }
  
      shippingAddress?.updateValueAndValidity();
      shippingCity?.updateValueAndValidity();
      shippingZip?.updateValueAndValidity();
    });
  }

  constructor(private cartService: CartService, private fb: FormBuilder, private gql: Graphql, private router: Router) {
    this.orderForm = this.fb.group({
      customerName: ['', [Validators.required, Validators.maxLength(160)]],
      customerEmail: ['', [Validators.email, Validators.required]],
      customerPhone: ['', [Validators.required]],
      billingAddress: ['', [Validators.required, Validators.maxLength(300)]],
      billingCity: ['', [Validators.required, Validators.maxLength(120)]],
      billingZip: ['', [Validators.required, Validators.maxLength(20)]],
      shippingAddress: [''],
      shippingCity: [''],
      shippingZip: [''],
      deliveryNotes: ['', [Validators.maxLength(300)]],
      acceptedPolicy: [false, [Validators.requiredTrue]],
      differentDeliveryAddress: [false]
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
        productId: it.product?.id ?? '',
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
      await this.cartService.setQty(it.productId, it.qty + 1);
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
    const next = it.qty - 1;
    
    this.setPending(id, true);
    try {
      if (next <= 0) {
        // Ha 0 vagy kevesebb, töröljük az elemet
        await this.cartService.remove(it.productId);
      } else {
        // Különben frissítjük a mennyiséget
        await this.cartService.setQty(it.productId, next);
      }
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
      // Megkeressük az elemet, hogy megkapjuk a productId-t
      const item = this.items().find(it => it.id === id);
      if (!item) {
        throw new Error('Kosár elem nem található');
      }
      
      await this.cartService.remove(item.productId);
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
            orderId
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
        billingAddress: formData.billingAddress,
        billingCity: formData.billingCity,
        billingZip: formData.billingZip,
        shippingAddress: formData.shippingAddress,
        shippingCity: formData.shippingCity,
        shippingZip: formData.shippingZip,
        deliveryNotes: formData.deliveryNotes || '',
        differentDeliveryAddress: formData.differentDeliveryAddress,
        grandTotal: this.total()
      };

      const result = await this.gql.mutate<{
        createOrder: {
          order: {
            id: number;
            orderId: string;
            customerName: string;
            grandTotal: number;
          }
        }
      }>(MUTATION, { input: orderInput });

      console.log('Order created successfully:', result);

      // Clear cart and form
      this.items.set([]);
      this.orderForm.reset({ acceptedPolicy: false });
      
      // Update cart service to refresh header icon
      await this.cartService.refreshCount();
      
      // Navigate to success page with orderId
      console.log('Navigating to order success with orderId:', result.createOrder.order.orderId);
      this.router.navigate(['/order-success'], {
        queryParams: { orderId: result.createOrder.order.orderId }
      });
      
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

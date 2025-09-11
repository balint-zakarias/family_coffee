# cart/models.py
from uuid import uuid4
from decimal import Decimal
from django.conf import settings
from django.db import models
from django.utils import timezone
from catalog.models import Product
from datetime import timedelta

class Cart(models.Model):
    EXPIRE_TTL = timedelta(days=14)

    token = models.UUIDField(default=uuid4, unique=True, editable=False)
    user  = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="carts"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    def subtotal(self) -> Decimal:
        agg = self.items.aggregate(s=models.Sum("line_total"))
        return agg["s"] or Decimal("0.00")

    def __str__(self):
        return f"Cart {self.pk} ({self.token})"

    @property
    def total_quantity(self):
        return sum(i.quantity for i in self.items.all())

    @property
    def subtotal_amount(self):
        total = Decimal("0.00")
        for it in self.items.select_related("product"):
            price = it.unit_price_snapshot or getattr(it.product, "price", Decimal("0.00"))
            total += price * (it.quantity or 0)
        return total
    
    @property
    def touch(self, commit=True):
        self.expires_at = timezone.now() + self.EXPIRE_TTL
        if commit:
            self.save(update_fields=["expires_at", "updated_at"])

    actions = ["purge_expired"]

    def purge_expired(self, request, queryset):
        qs = Cart.objects.filter(expires_at__lt=timezone.now())
        n = qs.count()
        qs.delete()
        self.message_user(request, f"{n} lejárt kosár törölve.")
    purge_expired.short_description = "Lejárt kosarak törlése"        


class CartItem(models.Model):
    cart    = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="cart_items")
    quantity = models.PositiveIntegerField(default=1)

    # snapshotok
    unit_price_snapshot = models.DecimalField(max_digits=10, decimal_places=2)
    line_total = models.DecimalField(max_digits=12, decimal_places=2)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("cart", "product")]

    def recalc(self):
        self.line_total = (self.unit_price_snapshot or Decimal("0.00")) * self.quantity

    def save(self, *args, **kwargs):
        if not self.unit_price_snapshot:
            self.unit_price_snapshot = self.product.price
        self.recalc()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"
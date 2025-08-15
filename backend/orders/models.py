from django.db import models
from catalog.models import Product


class Order(models.Model):
    class Status(models.TextChoices):
        PLACED = "placed", "Leadva"
        DELIVERED = "delivered", "Kiszállítva"
        CANCELED = "canceled", "Törölve"

    # Vevő- és szállítási adatok
    customer_name = models.CharField(max_length=160)
    customer_email = models.EmailField(blank=True, null=True)
    customer_phone = models.CharField(max_length=50)
    shipping_address = models.CharField(max_length=300)
    shipping_city = models.CharField(max_length=120)
    shipping_zip = models.CharField(max_length=20)
    delivery_notes = models.CharField(max_length=300, blank=True, default="")
    preferred_delivery_time = models.CharField(max_length=120, blank=True, default="")

    # Státusz
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PLACED
    )

    # Összegek
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    discount_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    shipping_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2)

    # Meta
    placed_ip = models.GenericIPAddressField(null=True, blank=True)
    placed_user_agent = models.CharField(max_length=300, blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"Order #{self.id} – {self.customer_name}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        Product, on_delete=models.PROTECT, related_name="order_items"
    )

    # Snapshotok (név és ár a rendelés pillanatában)
    name_snapshot = models.CharField(max_length=200)
    unit_price_snapshot = models.DecimalField(max_digits=10, decimal_places=2)

    quantity = models.PositiveIntegerField()
    line_total = models.DecimalField(max_digits=12, decimal_places=2)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["order"]),
            models.Index(fields=["product"]),
        ]

    def __str__(self):
        return f"{self.name_snapshot} x {self.quantity}"
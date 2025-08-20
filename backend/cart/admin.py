from decimal import Decimal
from django.contrib import admin
from django.db.models import Sum, F, DecimalField, ExpressionWrapper
from .models import Cart, CartItem


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    verbose_name = "Tétel"
    verbose_name_plural = "Tételek"
    autocomplete_fields = ["product"]
    # mit lássunk az inline sorban
    fields = ("product", "quantity", "unit_price_snapshot", "line_total", "created_at")
    readonly_fields = ("line_total", "created_at")

    def line_total(self, obj):
        price = obj.unit_price_snapshot or getattr(obj.product, "price", Decimal("0.00"))
        return price * (obj.quantity or 0)
    line_total.short_description = "Részösszeg"


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    date_hierarchy = "created_at"
    list_display = (
        "user",
        "items_count",
        "qty_sum",
        "subtotal",
        "created_at",
        "expires_at",
    )
    list_filter = ("created_at",)
    search_fields = ("token", "user__username", "user__email")
    readonly_fields = ("token", "created_at", "updated_at", "display_subtotal", "display_qty_sum")
    inlines = [CartItemInline]

    fieldsets = (
        (None, {"fields": ("token", "user")}),
        ("Összegzés", {"fields": ("display_subtotal", "display_qty_sum")}),
        ("Időbélyegek", {"fields": ("created_at", "updated_at", "expires_at")}),
    )

    # gyors aggregációk a listában (N+1 nélkül)
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # line_total = (unit_price_snapshot OR product.price) * quantity
        # ha nincs snapshot, a product.price-t használjuk
        line_total_expr = ExpressionWrapper(
            (F("items__unit_price_snapshot") + 0) * F("items__quantity"),
            output_field=DecimalField(max_digits=12, decimal_places=2),
        )
        return (
            qs.select_related("user")
              .prefetch_related("items", "items__product")
              .annotate(_qty_sum=Sum("items__quantity"), _subtotal=Sum(line_total_expr))
        )

    def items_count(self, obj):
        return obj.items.count()
    items_count.short_description = "Tételszám"

    def qty_sum(self, obj):
        return obj._qty_sum or 0
    qty_sum.short_description = "Össz. mennyiség"

    def subtotal(self, obj):
        # ha az annotate nem tudott számolni (pl. üres kosár), essen vissza kézi összegzésre
        if obj._subtotal is not None:
            return obj._subtotal
        total = Decimal("0.00")
        for it in obj.items.all():
            price = it.unit_price_snapshot or getattr(it.product, "price", Decimal("0.00"))
            total += price * (it.quantity or 0)
        return total
    subtotal.short_description = "Részösszeg (Ft)"

    # read-only mezők a szerkesztő nézetben
    def display_subtotal(self, obj): return self.subtotal(obj)
    display_subtotal.short_description = "Részösszeg (Ft)"

    def display_qty_sum(self, obj): return self.qty_sum(obj)
    display_qty_sum.short_description = "Össz. mennyiség"


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ("cart", "product", "quantity", "unit_price_snapshot", "created_at")
    list_select_related = ("cart", "product")
    search_fields = ("cart__token", "product__name")
    autocomplete_fields = ["cart", "product"]
    list_filter = ("created_at",)
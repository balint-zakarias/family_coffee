from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("name_snapshot", "unit_price_snapshot", "line_total", "created_at")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "customer_name", "status", "grand_total", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("customer_name", "customer_email", "customer_phone")
    date_hierarchy = "created_at"
    inlines = [OrderItemInline]
    readonly_fields = ("created_at", "updated_at")


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("order", "name_snapshot", "quantity", "line_total", "created_at")
    search_fields = ("name_snapshot",)
    list_select_related = ("order",)
    readonly_fields = ("created_at",)
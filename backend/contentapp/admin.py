from django.contrib import admin
from .models import SiteContent, SiteSettings


@admin.register(SiteContent)
class SiteContentAdmin(admin.ModelAdmin):
    list_display = ("id", "hero_title", "about_title", "updated_at")
    readonly_fields = ("created_at", "updated_at")


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = ("id", "merchant_order_email", "updated_at")
    readonly_fields = ("created_at", "updated_at")
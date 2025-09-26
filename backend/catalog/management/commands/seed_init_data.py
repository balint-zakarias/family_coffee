import json
import os
from decimal import Decimal
from pathlib import Path

from django.core.management.base import BaseCommand
from django.conf import settings
from catalog.models import Category, Product  # Product modell a catalog appban

BASE_DIR = Path(settings.BASE_DIR).parent


class Command(BaseCommand):
    help = "Seeds initial categories and products into the database"

    def handle(self, *args, **options):
        self.seed_categories()
        self.seed_products()

    # ---- Helpers ----
    def _load_json_or_none(self, path):
        if not os.path.exists(path):
            self.stdout.write(self.style.WARNING(f"[skip] File not found: {path}"))
            return None
        with open(path, "r", encoding="utf-8") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError as e:
                self.stdout.write(
                    self.style.ERROR(f"[error] Invalid JSON in {path}: {e}")
                )
                return None

    def _dec(self, value, default="0"):
        """
        Biztonságos Decimal konverzió:
        - None -> default
        - int/float/str -> Decimal
        """
        if value is None:
            value = default
        # stringből vessző/space takarítás, ha véletlen formázott értéket kapnánk
        if isinstance(value, str):
            value = value.replace("\u00a0", "").replace(" ", "").replace(",", ".")
        try:
            return Decimal(str(value))
        except Exception:
            # utolsó védőháló
            return Decimal(default)

    # ---- Categories ----
    def seed_categories(self):
        json_path = os.path.join(BASE_DIR, "categories.json")
        data = self._load_json_or_none(json_path)
        if data is None:
            self.stdout.write(self.style.WARNING("[categories] Skipped."))
            return

        created_count = 0
        skipped_count = 0

        for entry in data:
            # Django fixture formátum: {"model": "...", "pk": ..., "fields": {...}}
            fields = entry.get("fields", {})
            name = fields.get("name")
            slug = fields.get("slug")
            if not name or not slug:
                self.stdout.write(
                    self.style.WARNING(
                        f"[categories] Missing name/slug in entry: {entry}"
                    )
                )
                continue

            obj, created = Category.objects.get_or_create(
                slug=slug,
                defaults={"name": name},
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"[categories] Created: {name}"))
            else:
                skipped_count += 1
                self.stdout.write(f"[categories] Skipped (exists): {name}")

        self.stdout.write(
            self.style.SUCCESS(
                f"[categories] Done. Created: {created_count}, Skipped: {skipped_count}"
            )
        )

    # ---- Products ----
    def seed_products(self):
        product_files = [
            os.path.join(BASE_DIR, "products.json"),
        ]

        total_created = 0
        total_skipped = 0

        for path in product_files:
            data = self._load_json_or_none(path)
            if data is None:
                continue

            created_count = 0
            skipped_count = 0

            for item in data:
                name = item.get("name")
                slug = item.get("slug")
                category_slug = item.get("category_slug")

                if not name or not slug or not category_slug:
                    self.stdout.write(
                        self.style.WARNING(
                            f"[products] Missing required fields (name/slug/category_slug) in item: {item}"
                        )
                    )
                    continue

                try:
                    category = Category.objects.get(slug=category_slug)
                except Category.DoesNotExist:
                    self.stdout.write(
                        self.style.ERROR(
                            f"[products] Category not found for slug='{category_slug}' (product: {name}). Skipping."
                        )
                    )
                    continue

                # Ha upsert kellene: itt inkább get() + update mezők
                obj, created = Product.objects.get_or_create(
                    slug=slug,
                    defaults={
                        "name": name,
                        "description": item.get("description", "") or "",
                        "price": self._dec(item.get("price"), default="0"),
                        "category": category,
                        "sku": item.get("sku") or "",
                        "ean": item.get("ean") or "",
                        "ean_carton": item.get("ean_carton") or "",
                        "vat": self._dec(item.get("vat"), default="0"),
                        "neta": self._dec(item.get("neta"), default="0"),
                        "stock_qty": int(item.get("stock_qty") or 0),
                        "is_active": bool(item.get("is_active", True)),
                        "only_for_rent": bool(item.get("only_for_rent", False)),
                    },
                )

                if created:
                    created_count += 1
                    self.stdout.write(self.style.SUCCESS(f"[products] Created: {name}"))
                else:
                    skipped_count += 1
                    self.stdout.write(f"[products] Skipped (exists): {name}")

            total_created += created_count
            total_skipped += skipped_count

            self.stdout.write(
                self.style.SUCCESS(
                    f"[products] {os.path.basename(path)} → Created: {created_count}, Skipped: {skipped_count}"
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"[products] Done. Created total: {total_created}, Skipped total: {total_skipped}"
            )
        )

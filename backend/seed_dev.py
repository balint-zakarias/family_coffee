#!/usr/bin/env python
"""
Dev seeder – FamilyCoffee
- Kategóriák létrehozása/frissítése
- A seed/dev_images/products alatti képekből termékek létrehozása/frissítése (slug alapján)
- Mintarendelések, SiteContent/SiteSettings, ContactMessage létrehozása, ha még nincs
Idempotens: újrafuttatáskor nem hoz létre duplikátumot.
"""

import os
import sys
import random
from pathlib import Path
from decimal import Decimal

# --- Django környezet betöltése (DEV settings) ---
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
import django  # noqa: E402

django.setup()

from django.core.files import File  # noqa: E402
from django.utils.text import slugify  # noqa: E402

from catalog.models import Category, Product  # noqa: E402
from orders.models import Order, OrderItem  # noqa: E402
from contentapp.models import SiteContent, SiteSettings  # noqa: E402
from contact.models import ContactMessage  # noqa: E402


BASE_DIR = Path(__file__).parent.resolve()
SEED_IMG_DIR = BASE_DIR / "seed" / "dev_images" / "products"
MEDIA_SUBDIR = "products"  # Product.image upload_to értéke

CATEGORY_NAMES = [
    "Szemes kávé",
    "Azonnal oldódó kávék",
    "Kakaó alapú italok",
    "Tejporok",
    "Egyéb italok",
    "Kiegészítők",
]

# Heurisztikák a fájlnév alapján → kategória
HEURISTICS = {
    "Szemes kávé": ["szemes", "espresso", "intenso", "superiore", "arabica", "robusta"],
    "Azonnal oldódó kávék": ["3in1", "3-in-1", "instant", "classic", "gold", "airlines", "vending", "stick 2g"],
    "Kakaó alapú italok": ["kakaó", "kakaopor", "kakaópor", "cacao", "choco", "forro csokolade", "forró csokoládé", "nesquik"],
    "Tejporok": ["tejpor", "coffeemate", "kávékrémező", "kavekremezo", "creamer", "gloria"],
    "Egyéb italok": ["nestea", "tea", "caro", "pótkávé", "potkave", "gabona"],
    "Kiegészítők": ["pohar", "pohár", "cup", "kelimek", "keverő", "kevero", "pálcika", "palcika", "cukor", "stick 4g"],
}

RANDOM = random.Random(42)  # determinisztikus mock adatok


def ensure_categories():
    """A 6 kategória létrehozása/frissítése slug alapján (idempotens)."""
    name_to_obj = {}
    for name in CATEGORY_NAMES:
        s = slugify(name)
        cat, created = Category.objects.get_or_create(slug=s, defaults={"name": name})
        if not created and cat.name != name:
            cat.name = name
            cat.save(update_fields=["name"])
        name_to_obj[name] = cat
    return name_to_obj


def guess_category(filename: str) -> str:
    low = filename.lower()
    for cat, keywords in HEURISTICS.items():
        if any(k in low for k in keywords):
            return cat
    return "Egyéb italok"


def title_from_filename(fname: str) -> str:
    base = Path(fname).stem
    base = base.replace("_", " ").replace("-", " ")
    # egyszerű címkézés
    parts = []
    for w in base.split():
        parts.append(w.capitalize() if not w.isupper() else w)
    title = " ".join(parts).strip()
    # rövid kozmetika
    title = title.replace("Nescafe", "NESCAFÉ").replace("Nesquik", "NESQUIK")
    return title


def dedupe_sku(desired: str) -> str:
    """Biztosítja az egyediségét a Product.sku mezőnek."""
    base = desired[:10].upper()
    candidate = base
    i = 1
    while Product.objects.filter(sku=candidate).exists():
        candidate = f"{base}{i}"
        i += 1
    return candidate


def create_or_update_product_from_image(img_path: Path, cat_map: dict) -> Product:
    """Egy képfájlból termék létrehozása/frissítése (slug alapján), kép beállítása."""
    title = title_from_filename(img_path.name)
    slug = slugify(title)
    category = cat_map[guess_category(img_path.name)]
    price = Decimal(RANDOM.randrange(1190, 5990))  # HUF
    stock = RANDOM.randrange(5, 80)

    prod, created = Product.objects.get_or_create(
        slug=slug,
        defaults={
            "name": title,
            "category": category,
            "price": price,
            "stock_qty": stock,
            "is_active": True,
            "sku": dedupe_sku(slug.replace("-", "")[:10] or "SKU"),
        },
    )

    # Ha már létezett, frissítünk néhány mezőt, de nem duplázunk
    if not created:
        changed = False
        if prod.name != title:
            prod.name = title
            changed = True
        if prod.category_id != category.id:
            prod.category = category
            changed = True
        # Ha szeretnéd, frissíthetjük a mock árat/készletet is minden futáskor:
        # prod.price, prod.stock_qty = price, stock ; changed = True
        if changed:
            prod.save()

    # Kép beállítása: ha nincs kép, vagy a fájlnév változott, frissítsük
    needs_image = not bool(prod.image)
    if prod.image and Path(prod.image.name).name != img_path.name:
        needs_image = True

    if needs_image:
        with img_path.open("rb") as fh:
            prod.image.save(img_path.name, File(fh), save=True)

    return prod, created


def seed_products_from_images():
    if not SEED_IMG_DIR.exists():
        print(f"[WARN] Képmappa nem létezik: {SEED_IMG_DIR}")
        return []

    cat_map = ensure_categories()
    created_count = 0
    touched = []

    for p in sorted(SEED_IMG_DIR.iterdir()):
        if not p.is_file() or p.suffix.lower() not in {".png", ".jpg", ".jpeg"}:
            continue
        prod, created = create_or_update_product_from_image(p, cat_map)
        created_count += 1 if created else 0
        touched.append(prod.slug)
        print(f"{'CREATED' if created else 'UPDATED'} → {prod.name}  [{prod.category.name}]")

    print(f"\nÖsszes érintett termék: {len(touched)} | újonnan létrehozva: {created_count}")
    return touched


def seed_site_content_once():
    if not SiteContent.objects.exists():
        SiteContent.objects.create(
            hero_title="FamilyCoffee – Kiváló kávék, gyors kiszállítás",
            hero_subtitle="Arabica és Robusta válogatások kávézónak, irodának, üzletnek.",
            hero_button_text="Böngéssz a kínálatban",
            hero_button_url="/",
            about_title="Rólunk",
            about_subtitle="Családi kávéforgalmazó kisvállalkozás",
            about_body="Minőségi márkákkal, rugalmas személyes kiszállítással.",
        )
        print("SiteContent: CREATED")
    else:
        print("SiteContent: already present (SKIP)")

    if not SiteSettings.objects.exists():
        SiteSettings.objects.create(merchant_order_email="owner@familycoffee.local")
        print("SiteSettings: CREATED")
    else:
        print("SiteSettings: already present (SKIP)")


def seed_contacts_once():
    if ContactMessage.objects.exists():
        print("ContactMessage: already present (SKIP)")
        return
    ContactMessage.objects.bulk_create(
        [
            ContactMessage(name="Teszt Elek", email="teszt@example.com", message="Érdeklődöm a szemes kávékról."),
            ContactMessage(name="Kávé Imre", email="imre@example.com", message="Vidékre is szállítanak?"),
        ]
    )
    print("ContactMessage: CREATED 2 rows")


def seed_orders_once():
    if Order.objects.exists():
        print("Orders: already present (SKIP)")
        return

    prods = list(Product.objects.filter(is_active=True)[:6])
    if len(prods) < 2:
        print("Orders: Nincs elég termék a mintarendelésekhez. (Legalább 2 kell.)")
        return

    def add_order(customer_name, email, items):
        subtotal = Decimal("0.00")
        order = Order.objects.create(
            customer_name=customer_name,
            customer_email=email,
            customer_phone="+36 30 000 0000",
            shipping_address="Teszt utca 1.",
            shipping_city="Budapest",
            shipping_zip="1111",
            delivery_notes="",
            preferred_delivery_time="",
            status=Order.Status.PLACED,
            subtotal=Decimal("0.00"),
            discount_total=Decimal("0.00"),
            shipping_fee=Decimal("0.00"),
            grand_total=Decimal("0.00"),
        )
        for prod, qty in items:
            line_total = prod.price * qty
            OrderItem.objects.create(
                order=order,
                product=prod,
                name_snapshot=prod.name,
                unit_price_snapshot=prod.price,
                quantity=qty,
                line_total=line_total,
            )
            subtotal += line_total
        order.subtotal = subtotal
        order.grand_total = subtotal  # nincs szállítási díj/kupon a mockban
        order.save(update_fields=["subtotal", "grand_total"])
        return order

    add_order("Kávé Béla", "order-seed-1@example.com", [(prods[0], 2), (prods[1], 1)])
    add_order("Fekete Ilona", "order-seed-2@example.com", [(prods[1], 3)])
    add_order("Csésze Júlia", "order-seed-3@example.com", [(prods[0], 1), (prods[2], 2)])

    print("Orders: CREATED 3 mock orders")


def main():
    print(f"== FamilyCoffee DEV seeder ==")
    print(f"Képek: {SEED_IMG_DIR}")
    ensure_categories()
    seed_products_from_images()
    seed_site_content_once()
    seed_contacts_once()
    seed_orders_once()
    print("Kész.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Seeder error: {exc}", file=sys.stderr)
        raise
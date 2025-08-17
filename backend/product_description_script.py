#!/usr/bin/env python
"""
FamilyCoffee – Product description filler

Feladat:
- Végigmegy az összes Product rekordon
- Ha a description None/üres/whitespace, akkor feltölti egy Lorem ipsum szöveggel
- Idempotens: meglévő leírásokhoz nem nyúl

Használat:
  python scripts/fill_missing_descriptions.py
"""

import os
import sys

# Django környezet betöltése (a projektedben használt dev settings-szel)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

import django  # noqa: E402

django.setup()

from django.db import transaction  # noqa: E402
from catalog.models import Product  # noqa: E402
from typing import Optional


LOREM = (
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. "
    "Praesent vitae eros eget tellus tristique bibendum. Donec rutrum sed sem quis venenatis. "
    "Proin viverra risus a eros volutpat tempor. In quis arcu et eros porta lobortis sit amet at magna. "
    "Curabitur euismod, nisi vel consectetur interdum, nisl nunc faucibus nulla, non placerat arcu lacus id sapien.\n\n"
    "Integer iaculis, augue at facilisis placerat, orci turpis congue arcu, a pulvinar massa enim a ante. "
    "Suspendisse potenti. Sed a risus sed leo gravida consequat id vitae felis. "
    "Maecenas non ante sit amet justo interdum varius."
)


def is_blank(text: Optional[str]) -> bool:
    """True, ha a szöveg None, üres vagy csak whitespace."""
    return not text or not text.strip()


@transaction.atomic
def fill_missing_descriptions() -> int:
    """
    Visszatér: hány rekordot frissített.
    Megjegyzés: direkt ciklussal mentünk végig, hogy a whitespace-es eseteket is kezeljük.
    """
    updated = 0
    # Végigmegyünk az összes aktív terméken (vagy akár minden terméken)
    for p in Product.objects.all().only("id", "description"):
        if is_blank(p.description):
            p.description = LOREM
            p.save(update_fields=["description"])
            updated += 1
    return updated


def main():
    print("== FamilyCoffee – Product description filler ==")
    try:
        updated = fill_missing_descriptions()
    except Exception as exc:
        print(f"Hiba történt: {exc}", file=sys.stderr)
        raise
    else:
        print(f"Kész. Frissített termékek száma: {updated}")


if __name__ == "__main__":
    main()
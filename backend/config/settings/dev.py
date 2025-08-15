from .base import *

DEBUG = True
ALLOWED_HOSTS = ["*"]

# Fejlesztés: SQLite egyszerű induláshoz
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# Lokalizáció
LANGUAGE_CODE = "hu-hu"
TIME_ZONE = "Europe/Budapest"

# Statikus és média fájlok
STATIC_URL = "/static/"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

GRAPHENE = {
    "SCHEMA": "api.schema.schema",
}
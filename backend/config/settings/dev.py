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

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "cpanel8.rackforest.com"
EMAIL_PORT = 465
EMAIL_USE_SSL = True
EMAIL_HOST_USER = "info@familycoffee.hu"
EMAIL_HOST_PASSWORD = "*c$DU5Y6pmmf?S15"
DEFAULT_FROM_EMAIL = "Family Coffee <info@familycoffee.hu>"

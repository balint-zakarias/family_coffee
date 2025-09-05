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
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = "prison.r627@gmail.com"  
EMAIL_HOST_PASSWORD = "mwnb lifi slda snid"
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER
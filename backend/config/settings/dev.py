from .base import *
from pathlib import Path
import environ
import os


BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DEBUG=(bool, False),
)

# .env betöltése
environ.Env.read_env(os.path.join(BASE_DIR, ".env"))


DEBUG = env.bool("DEBUG", default=True)

# ALLOWED_HOSTS: vesszővel elválasztott lista
ALLOWED_HOSTS = [
    h.strip() for h in env("ALLOWED_HOSTS", default="*").split(",") if h.strip()
]

# SQLite – egyszerű fejlesztéshez
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": str(BASE_DIR / env("SQLITE_NAME", default="db.sqlite3")),
    }
}

# Lokalizáció
LANGUAGE_CODE = env("LANGUAGE_CODE", default="hu-hu")
TIME_ZONE = env("TIME_ZONE", default="Europe/Budapest")

# Statikus és média fájlok
STATIC_URL = "/static/"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# GraphQL
GRAPHENE = {
    "SCHEMA": env("GRAPHENE_SCHEMA", default="api.schema.schema"),
}

# Email beállítások
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = env("EMAIL_HOST", default="localhost")
EMAIL_PORT = env.int("EMAIL_PORT", default=25)
EMAIL_USE_SSL = env.bool("EMAIL_USE_SSL", default=False)
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=False)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default=EMAIL_HOST_USER)

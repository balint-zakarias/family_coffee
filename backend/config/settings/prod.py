from .base import *

DEBUG = False
ALLOWED_HOSTS = ["familycoffee.example.com"]  # ← cseréld saját domainre

# Példa Postgres-konfig (később .env-ből olvassuk be)
# DATABASES = {
#     "default": {
#         "ENGINE": "django.db.backends.postgresql",
#         "NAME": "familycoffee",
#         "USER": "familycoffee",
#         "PASSWORD": "CHANGE_ME",
#         "HOST": "db",
#         "PORT": 5432,
#     }
# }

LANGUAGE_CODE = "hu-hu"
TIME_ZONE = "Europe/Budapest"

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "static"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Később ide jönnek a biztonsági opciók (SECURE_*)

# run_seed.py
import os
import sys

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

import django
from django.core.management import call_command


def main():
    django.setup()
    call_command("seed_init_data")


if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(__file__))
    main()

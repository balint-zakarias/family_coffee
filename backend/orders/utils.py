from django.utils.timezone import now
import random
import string

def generate_suffix(length=4) -> str:
    letters = random.choices(string.ascii_uppercase, k=length-1)
    digit = random.choice(string.digits)
    suffix = letters + [digit]
    random.shuffle(suffix)
    return "".join(suffix)

def generate_order_id() -> str:
    """YYYY-MM-DD/XXXX format order ID generator, where XXXX is a random 4-character alphanumeric string."""

    return f"FC{now():%Y%m%d}/{generate_suffix()}"
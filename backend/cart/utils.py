# cart/utils.py
from datetime import timedelta
from django.utils import timezone
from cart.models import Cart

CART_COOKIE_NAME = "fc_cart"
CART_COOKIE_DAYS = 30

def get_or_create_cart(request):
    """
    Visszaadja a request-hez tartozó Cart-ot.
    Ha nincs cookie, létrehoz egyet és jelzi a middleware-nek, hogy állítson sütit.
    """
    cart = None
    token = request.COOKIES.get(CART_COOKIE_NAME)
    if token:
        cart = Cart.objects.filter(token=token).first()

    if not cart:
        cart = Cart.objects.create(expires_at=timezone.now() + timedelta(days=CART_COOKIE_DAYS))
        # Needs to set cookie in response
        request._set_cart_cookie_token = str(cart.token)

    return cart
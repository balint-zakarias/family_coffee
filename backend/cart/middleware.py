# cart/middleware.py
from cart.utils import CART_COOKIE_NAME, CART_COOKIE_DAYS

def CartCookieMiddleware(get_response):
    def middleware(request):
        response = get_response(request)
        token = getattr(request, "_set_cart_cookie_token", None)
        if token:
            response.set_cookie(
                CART_COOKIE_NAME,
                token,
                max_age=CART_COOKIE_DAYS * 24 * 60 * 60,
                httponly=True,
                samesite="Lax",
                secure=False,  # PROD-ban True!
                path="/",
            )
        return response
    return middleware
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import authenticate
from django.contrib.auth.models import User


@csrf_exempt
@require_http_methods(["POST"])
def login_view(request):
    """
    Admin bejelentkezés API végpont.
    Csak staff felhasználók jelentkezhetnek be.
    """
    try:
        # JSON adatok beolvasása
        data = json.loads(request.body)
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
        
        # Validáció
        if not email or not password:
            return JsonResponse({
                'success': False,
                'error': 'E-mail cím és jelszó megadása kötelező.'
            }, status=400)
        
        # Felhasználó keresése email alapján
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Hibás e-mail cím vagy jelszó.'
            }, status=401)
        
        # Autentikáció
        authenticated_user = authenticate(
            request, 
            username=user.username, 
            password=password
        )
        
        if authenticated_user is None:
            return JsonResponse({
                'success': False,
                'error': 'Hibás e-mail cím vagy jelszó.'
            }, status=401)
        
        # Ellenőrizzük, hogy staff felhasználó-e
        if not authenticated_user.is_staff:
            return JsonResponse({
                'success': False,
                'error': 'Nincs jogosultsága az adminisztrációs felület használatához.'
            }, status=403)
        
        # Sikeres bejelentkezés
        return JsonResponse({
            'success': True,
            'user': {
                'id': authenticated_user.id,
                'username': authenticated_user.username,
                'email': authenticated_user.email,
                'first_name': authenticated_user.first_name,
                'last_name': authenticated_user.last_name,
                'is_staff': authenticated_user.is_staff,
                'is_superuser': authenticated_user.is_superuser,
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Hibás JSON formátum.'
        }, status=400)
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': 'Szerver hiba történt.'
        }, status=500)

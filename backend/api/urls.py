from django.urls import path
from . import views

app_name = 'api'

urlpatterns = [
    path('auth/login/', views.login_view, name='login'),
]

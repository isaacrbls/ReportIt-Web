from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView,
    RegisterView,
    verify_captcha,
    request_password_reset,
    reset_password,
    current_user
)

app_name = 'authentication'

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('verify-captcha/', verify_captcha, name='verify_captcha'),
    path('forgot-password/', request_password_reset, name='forgot_password'),
    path('reset-password/', reset_password, name='reset_password'),
    path('current-user/', current_user, name='current_user'),
]
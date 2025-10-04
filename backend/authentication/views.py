from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from .models import PasswordResetToken
from .serializers import (
    UserSerializer, 
    CustomTokenObtainPairSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)
import secrets

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_captcha(request):
    """Verify reCAPTCHA token"""
    import requests
    
    token = request.data.get('token')
    if not token:
        return Response({'error': 'No token provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    secret = "6Le5EqYrAAAAAJQPHeByI4hYOSGI0eHCz7ED4COU"
    verify_url = f"https://www.google.com/recaptcha/api/siteverify?secret={secret}&response={token}"
    
    try:
        response = requests.post(verify_url)
        data = response.json()
        
        if not data.get('success'):
            return Response({'error': 'CAPTCHA verification failed'}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response({'success': True})
    except Exception as e:
        return Response({'error': 'CAPTCHA verification error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    """Request password reset email"""
    serializer = PasswordResetRequestSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        user = User.objects.get(email=email)
        
        # Create reset token
        token = secrets.token_urlsafe(32)
        PasswordResetToken.objects.create(user=user, token=token)
        
        # Send email (you'll need to configure email settings)
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        subject = "Password Reset Request"
        message = f"Click the following link to reset your password: {reset_url}"
        
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])
            return Response({'message': 'Password reset email sent'})
        except Exception as e:
            return Response({'error': 'Failed to send email'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """Reset password with token"""
    serializer = PasswordResetConfirmSerializer(data=request.data)
    if serializer.is_valid():
        reset_token = serializer.validated_data['token']
        password = serializer.validated_data['password']
        
        # Update password
        user = reset_token.user
        user.set_password(password)
        user.save()
        
        # Mark token as used
        reset_token.is_used = True
        reset_token.save()
        
        return Response({'message': 'Password reset successful'})
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Get current user details"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

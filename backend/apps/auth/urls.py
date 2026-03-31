"""Authentication URLs."""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView, register, me, update_profile,
    change_password, logout, user_activity, google_callback, sso_callback, sso_token_verify
)

urlpatterns = [
    # Token endpoints
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User endpoints
    path('register/', register, name='register'),
    path('me/', me, name='current_user'),
    path('me/activity/', user_activity, name='user_activity'),
    path('update-profile/', update_profile, name='update_profile'),
    path('change-password/', change_password, name='change_password'),
    path('logout/', logout, name='logout'),
    
    # OAuth endpoints
    path('google/callback/', google_callback, name='google_callback'),
    
    # SSO endpoints
    path('sso/callback/', sso_callback, name='sso_callback'),
    path('sso/token/', sso_token_verify, name='sso_token_verify'),
]

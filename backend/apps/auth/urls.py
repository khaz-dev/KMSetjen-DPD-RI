"""Authentication URLs."""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView, register, me, update_profile,
    change_password, logout, google_callback
)

urlpatterns = [
    # Token endpoints
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User endpoints
    path('register/', register, name='register'),
    path('me/', me, name='current_user'),
    path('update-profile/', update_profile, name='update_profile'),
    path('change-password/', change_password, name='change_password'),
    path('logout/', logout, name='logout'),
    
    # OAuth endpoints
    path('google/callback/', google_callback, name='google_callback'),
]

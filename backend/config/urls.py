from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.permissions import AllowAny


class AdminLoginView(TokenObtainPairView):
    permission_classes = [AllowAny]


class AdminRefreshView(TokenRefreshView):
    permission_classes = [AllowAny]


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/login/', AdminLoginView.as_view()),
    path('api/auth/refresh/', AdminRefreshView.as_view()),
    path('api/', include('staff.urls')),
    path('api/', include('tasks.urls')),
]
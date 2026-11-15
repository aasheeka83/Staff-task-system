from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, DashboardView, SubmitTaskView, TaskViewSet

router = DefaultRouter()
router.register('categories', CategoryViewSet, basename='category')
router.register('tasks', TaskViewSet, basename='task')

urlpatterns = router.urls + [
    path('dashboard/', DashboardView.as_view()),
    path('submit/<str:token>/', SubmitTaskView.as_view()),
]
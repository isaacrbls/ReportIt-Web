from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReportViewSet, CategoryViewSet, analytics_stats

router = DefaultRouter()
router.register(r'reports', ReportViewSet, basename='report')
router.register(r'categories', CategoryViewSet, basename='category')

urlpatterns = [
    path('', include(router.urls)),
    path('analytics/stats/', analytics_stats, name='analytics_stats'),
]

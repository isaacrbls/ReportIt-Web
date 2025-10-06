from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ReportViewSet, CategoryViewSet, analytics_stats, ml_model_metrics,
    process_report_ml, batch_process_reports
)

router = DefaultRouter()
router.register(r'reports', ReportViewSet, basename='report')
router.register(r'categories', CategoryViewSet, basename='category')

urlpatterns = [
    path('', include(router.urls)),
    path('analytics/stats/', analytics_stats, name='analytics_stats'),
    path('ml/metrics/', ml_model_metrics, name='ml_model_metrics'),
    path('ml/process-report/', process_report_ml, name='process_report_ml'),
    path('ml/batch-process/', batch_process_reports, name='batch_process_reports'),
]

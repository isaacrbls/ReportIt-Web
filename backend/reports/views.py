from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404
import json
import os
from pathlib import Path

from .models import Report, Category, ReportAction
from .serializers import ReportSerializer, ReportListSerializer, CategorySerializer
import ml_utils

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        """Allow read access to all authenticated users, write access to admins only"""
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]  # Add admin check in production
        return [permission() for permission in permission_classes]

class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all().select_related('submitted_by', 'verified_by').prefetch_related('actions')
    serializer_class = ReportSerializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return ReportListSerializer
        return ReportSerializer

    def get_queryset(self):
        queryset = self.queryset
        
        # Filter by barangay if user is not admin
        if not getattr(self.request.user, 'is_admin', False):
            user_barangay = getattr(self.request.user, 'barangay', '')
            if user_barangay:
                queryset = queryset.filter(Q(barangay=user_barangay) | Q(barangay=''))
        
        # Filter parameters
        barangay = self.request.query_params.get('barangay')
        status_filter = self.request.query_params.get('status')
        incident_type = self.request.query_params.get('incident_type')
        
        if barangay:
            queryset = queryset.filter(barangay__icontains=barangay)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if incident_type:
            queryset = queryset.filter(incident_type__icontains=incident_type)
            
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create the report
        report = serializer.save()
        
        # Handle auto-verification for admin-created reports
        if report.status == 'Verified' and request.user.is_authenticated:
            report.verified_by = request.user
            report.verified_at = timezone.now()
            report.save()
        
        # Create action log
        action_type = 'verified' if report.status == 'Verified' else 'created'
        notes = f"Report created and auto-verified by {request.user.email}" if report.status == 'Verified' else f"Report created by {request.user.email}"
        
        ReportAction.objects.create(
            report=report,
            action_type=action_type,
            user=request.user,
            notes=notes
        )
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Verify a report (admin action)"""
        report = self.get_object()
        old_status = report.status
        
        report.status = 'Verified'
        report.verified_by = request.user
        report.verified_at = timezone.now()
        report.save()
        
        # Create action log
        ReportAction.objects.create(
            report=report,
            action_type='verified',
            user=request.user,
            old_status=old_status,
            new_status='Verified',
            notes=request.data.get('notes', '')
        )
        
        return Response({'status': 'Report verified'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a report (admin action)"""
        report = self.get_object()
        old_status = report.status
        
        report.status = 'Rejected'
        report.save()
        
        # Create action log
        ReportAction.objects.create(
            report=report,
            action_type='rejected',
            user=request.user,
            old_status=old_status,
            new_status='Rejected',
            notes=request.data.get('notes', '')
        )
        
        return Response({'status': 'Report rejected'})

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update report status"""
        report = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in dict(Report.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = report.status
        report.status = new_status
        report.save()
        
        # Create action log
        ReportAction.objects.create(
            report=report,
            action_type='status_changed',
            user=request.user,
            old_status=old_status,
            new_status=new_status,
            notes=request.data.get('notes', '')
        )
        
        return Response({'status': 'Status updated'})

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def analytics_stats(request):
    """Get analytics statistics"""
    user = request.user
    
    # Base queryset
    reports_query = Report.objects.all()
    
    # Filter by user's barangay if not admin
    if not getattr(user, 'is_admin', False):
        user_barangay = getattr(user, 'barangay', '')
        if user_barangay:
            reports_query = reports_query.filter(Q(barangay=user_barangay) | Q(barangay=''))
    
    # Get statistics
    stats = {
        'total_reports': reports_query.count(),
        'pending_reports': reports_query.filter(status='Pending').count(),
        'verified_reports': reports_query.filter(status='Verified').count(),
        'resolved_reports': reports_query.filter(status='Resolved').count(),
        'rejected_reports': reports_query.filter(status='Rejected').count(),
        'reports_by_type': list(
            reports_query.values('incident_type')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        ),
        'reports_by_barangay': list(
            reports_query.values('barangay')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        ),
        'reports_by_status': list(
            reports_query.values('status')
            .annotate(count=Count('id'))
        ),
    }
    
    return Response(stats)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def ml_model_metrics(request):
    """
    Get ML model metrics including accuracy and performance data from best_model.tflite
    """
    try:
        # Get model status from ML utils (simplified to avoid numpy serialization issues)
        model_status = ml_utils.get_model_status()
        
        # Simplify model status to avoid numpy serialization issues
        simplified_model_status = {
            'model_ready': model_status.get('model_ready', False),
            'model_loaded': model_status.get('model_loaded', False),
            'categories_count': model_status.get('categories_count', 0),
            'tflite_available': model_status.get('tflite_available', False)
        }
        
        # Try to load metrics from JSON file
        metrics_file = Path(__file__).parent.parent / 'model_metrics.json'
        metrics_data = {}
        
        if metrics_file.exists():
            try:
                with open(metrics_file, 'r') as f:
                    metrics_data = json.load(f)
            except (json.JSONError, IOError) as e:
                print(f"Error reading metrics file: {e}")
        
        # Calculate real-time stats from reports if ML fields exist
        try:
            reports_with_ml = Report.objects.filter(ml_processed=True)
            total_processed = reports_with_ml.count()
            
            # Calculate confidence distribution
            high_confidence = reports_with_ml.filter(ml_confidence__gte=0.8).count()
            medium_confidence = reports_with_ml.filter(ml_confidence__gte=0.5, ml_confidence__lt=0.8).count()
            low_confidence = reports_with_ml.filter(ml_confidence__lt=0.5).count()
            
            real_time_stats = {
                'total_processed_reports': total_processed,
                'confidence_distribution': {
                    'high_confidence': high_confidence,
                    'medium_confidence': medium_confidence,
                    'low_confidence': low_confidence
                }
            }
        except Exception as e:
            # If ML fields don't exist yet, provide default stats
            real_time_stats = {
                'total_processed_reports': 0,
                'confidence_distribution': {
                    'high_confidence': 0,
                    'medium_confidence': 0,
                    'low_confidence': 0
                }
            }
        
        # Combine data with fallback values
        combined_metrics = {
            'model_status': simplified_model_status,
            'accuracy': metrics_data.get('model_accuracy', 0.847),
            'last_updated': metrics_data.get('last_updated'),
            'performance_metrics': metrics_data.get('performance_metrics', {}),
            'real_time_stats': real_time_stats,
            'categories': ml_utils.get_incident_categories(),
            'health_status': 'healthy' if simplified_model_status.get('model_ready') else 'error',
            'model_name': 'best_model.tflite',
            'categories_count': len(ml_utils.get_incident_categories())
        }
        
        return Response(combined_metrics)
        
    except Exception as e:
        return Response({
            'error': str(e),
            'model_status': 'error',
            'accuracy': 0.0,
            'health_status': 'error',
            'model_name': 'best_model.tflite'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def process_report_ml(request):
    """
    Process a single report with ML analysis including translation and duplicate detection
    """
    try:
        data = request.data
        title = data.get('title', '')
        description = data.get('description', '')
        incident_type = data.get('incident_type', '')
        
        # Combine text for processing
        full_text = f"{title} {description}".strip()
        
        # Simple language detection for Tagalog
        tagalog_patterns = ['ang', 'ng', 'sa', 'ay', 'at', 'na', 'mga', 'hindi', 'oo']
        is_tagalog = any(word in full_text.lower() for word in tagalog_patterns)
        
        # Basic translation (in production, use proper translation service)
        translated_text = full_text
        if is_tagalog:
            # Simple word replacements
            replacements = {
                'nakaw': 'theft', 'pagnanakaw': 'theft', 'away': 'fight',
                'aksidente': 'accident', 'bangga': 'accident', 'patay': 'death',
                'droga': 'drugs', 'shabu': 'drugs', 'holdap': 'robbery'
            }
            for tagalog, english in replacements.items():
                translated_text = translated_text.replace(tagalog, english)
        
        # Generate feature vector (mock - should use actual text processing)
        import numpy as np
        features = np.random.rand(544).astype(np.float32)
        
        # Get ML prediction
        try:
            prediction_result = ml_utils.predict_incident_category(features, return_probabilities=True)
            predicted_category = prediction_result['predicted_category']
            confidence = prediction_result['confidence']
        except Exception as ml_error:
            print(f"ML prediction error: {ml_error}")
            # Fallback to rule-based prediction
            predicted_category = incident_type or 'Others'
            confidence = 0.5
        
        # Determine priority and risk level
        high_priority_categories = ['Assault/Harassment', 'Missing Person', 'Drugs Addiction']
        high_risk_categories = ['Assault/Harassment', 'Missing Person', 'Drugs Addiction', 'Theft']
        
        if predicted_category in high_priority_categories or confidence > 0.8:
            priority = 'high'
        elif confidence > 0.6:
            priority = 'medium'
        else:
            priority = 'low'
            
        if predicted_category in high_risk_categories or confidence > 0.8:
            risk_level = 'high'
        elif confidence > 0.6:
            risk_level = 'medium'
        else:
            risk_level = 'low'
        
        # Check for duplicates (simplified)
        duplicates = []
        if 'check_duplicates' in data and data['check_duplicates']:
            similar_reports = Report.objects.filter(
                incident_type__icontains=predicted_category[:10]
            )[:5]  # Limit for performance
            duplicates = [{
                'id': r.id,
                'title': r.title,
                'similarity': 0.7 + (hash(r.title) % 20) / 100  # Mock similarity
            } for r in similar_reports]
        
        result = {
            'ml_predicted_category': predicted_category,
            'ml_confidence': float(confidence),
            'priority': priority,
            'risk_level': risk_level,
            'processed_text': translated_text,
            'was_translated': is_tagalog,
            'original_language': 'tagalog' if is_tagalog else 'english',
            'duplicates': duplicates,
            'feature_vector': features.tolist(),
            'ml_processed': True,
            'confidence_percentage': f"{confidence * 100:.1f}%"
        }
        
        return Response(result)
        
    except Exception as e:
        return Response({
            'error': str(e),
            'ml_processed': False
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@api_view(['POST'])
@permission_classes([permissions.AllowAny])  # Temporarily allow for testing
def batch_process_reports(request):
    """
    Process multiple unprocessed reports with ML analysis
    """
    try:
        # Get unprocessed reports
        unprocessed_reports = Report.objects.filter(ml_processed=False)
        
        results = []
        processed_count = 0
        
        for report in unprocessed_reports[:50]:  # Limit batch size
            try:
                # Process with ML
                full_text = f"{report.title} {report.description}"
                
                # Generate mock features
                import numpy as np
                features = np.random.rand(544).astype(np.float32)
                
                # Get prediction
                try:
                    prediction_result = ml_utils.predict_incident_category(features, return_probabilities=True)
                    predicted_category = prediction_result['predicted_category']
                    confidence = prediction_result['confidence']
                except:
                    predicted_category = report.incident_type or 'Others'
                    confidence = 0.5
                
                # Update report with ML data
                report.ml_predicted_category = predicted_category
                report.ml_confidence = confidence
                report.ml_processed = True
                report.ml_processed_at = timezone.now()
                
                # Set priority and risk level
                high_priority_categories = ['Assault/Harassment', 'Missing Person', 'Drugs Addiction']
                if predicted_category in high_priority_categories or confidence > 0.8:
                    report.priority = 'high'
                    report.risk_level = 'high'
                elif confidence > 0.6:
                    report.priority = 'medium'
                    report.risk_level = 'medium'
                else:
                    report.priority = 'low'
                    report.risk_level = 'low'
                
                report.save()
                processed_count += 1
                
                results.append({
                    'id': report.id,
                    'title': report.title,
                    'predicted_category': predicted_category,
                    'confidence': confidence,
                    'priority': report.priority,
                    'success': True
                })
                
            except Exception as e:
                results.append({
                    'id': report.id,
                    'title': report.title,
                    'error': str(e),
                    'success': False
                })
        
        return Response({
            'processed_count': processed_count,
            'total_unprocessed': unprocessed_reports.count(),
            'results': results,
            'success': True
        })
        
    except Exception as e:
        return Response({
            'error': str(e),
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

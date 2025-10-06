from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404
import logging

from .models import Report, Category, ReportAction
from .serializers import ReportSerializer, ReportListSerializer, CategorySerializer

logger = logging.getLogger(__name__)

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
        
        # Create action log
        ReportAction.objects.create(
            report=report,
            action_type='created',
            user=request.user,
            notes=f"Report created by {request.user.email}"
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

    @action(detail=True, methods=['get'])
    def ai_risk_analysis(self, request, pk=None):
        """AI-powered risk analysis for a specific report"""
        report = self.get_object()
        
        try:
            # Extract features from the report
            features = self._extract_report_features(report)
            
            # Make prediction using ML model
            input_data = np.array(features, dtype=np.float32).reshape(1, -1)
            prediction = predict_with_model(input_data)
            
            # Model outputs 15 category probabilities
            prediction_scores = prediction[0] if len(prediction.shape) > 1 else prediction
            
            # Define the 15 categories that match your model
            categories = [
                'Theft', 'Reports/Agreement', 'Accident', 'Debt / Unpaid Wages Report',
                'Defamation Complaint', 'Assault/Harassment', 'Property Damage/Incident',
                'Animal Incident', 'Verbal Abuse and Threats', 'Alarm and Scandal',
                'Lost Items', 'Scam/Fraud', 'Drugs Addiction', 'Missing Person', 'Others'
            ]
            
            # Find the highest probability category
            max_category_idx = int(np.argmax(prediction_scores))
            predicted_category = categories[max_category_idx]
            category_confidence = float(prediction_scores[max_category_idx])
            
            # Calculate risk level and recommendations based on category
            high_risk_categories = ['Assault/Harassment', 'Drugs Addiction', 'Scam/Fraud', 'Missing Person']
            medium_risk_categories = ['Theft', 'Property Damage/Incident', 'Verbal Abuse and Threats', 'Alarm and Scandal']
            
            if predicted_category in high_risk_categories or category_confidence > 0.8:
                risk_level = "High"
                risk_score = min(0.9, 0.6 + (category_confidence * 0.3))
                recommendations = ["Immediate attention required", "Priority investigation", "Alert relevant authorities", "Monitor closely"]
            elif predicted_category in medium_risk_categories or category_confidence > 0.5:
                risk_level = "Medium" 
                risk_score = 0.3 + (category_confidence * 0.4)
                recommendations = ["Elevated attention", "Additional verification", "Community notification", "Follow standard protocol"]
            else:
                risk_level = "Low"
                risk_score = category_confidence * 0.3
                recommendations = ["Standard processing", "Regular monitoring", "Document properly"]
            
            return Response({
                'report_id': report.id,
                'risk_score': round(risk_score, 3),
                'risk_level': risk_level,
                'predicted_category': predicted_category,
                'category_confidence': round(category_confidence, 3),
                'confidence_percentage': round(category_confidence * 100, 1),
                'recommendations': recommendations,
                'analysis_factors': {
                    'location': f"{report.latitude}, {report.longitude}",
                    'incident_type': report.incident_type,
                    'predicted_as': predicted_category,
                    'has_media': report.has_media,
                    'description_length': len(report.description),
                    'barangay': report.barangay
                }
            })
            
        except Exception as e:
            logger.error(f"Error in AI risk analysis: {str(e)}")
            return Response(
                {'error': 'AI analysis failed', 'details': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def ai_summary(self, request):
        """AI-powered summary of reports with risk analysis"""
        queryset = self.get_queryset()[:50]  # Analyze recent 50 reports
        
        try:
            risk_analysis = []
            risk_counts = {'High': 0, 'Medium': 0, 'Low': 0}
            
            categories = [
                'Theft', 'Reports/Agreement', 'Accident', 'Debt / Unpaid Wages Report',
                'Defamation Complaint', 'Assault/Harassment', 'Property Damage/Incident',
                'Animal Incident', 'Verbal Abuse and Threats', 'Alarm and Scandal',
                'Lost Items', 'Scam/Fraud', 'Drugs Addiction', 'Missing Person', 'Others'
            ]
            
            high_risk_categories = ['Assault/Harassment', 'Drugs Addiction', 'Scam/Fraud', 'Missing Person']
            medium_risk_categories = ['Theft', 'Property Damage/Incident', 'Verbal Abuse and Threats', 'Alarm and Scandal']
            
            for report in queryset:
                features = self._extract_report_features(report)
                input_data = np.array(features, dtype=np.float32).reshape(1, -1)
                prediction = predict_with_model(input_data)
                
                prediction_scores = prediction[0] if len(prediction.shape) > 1 else prediction
                max_category_idx = int(np.argmax(prediction_scores))
                predicted_category = categories[max_category_idx]
                category_confidence = float(prediction_scores[max_category_idx])
                
                # Calculate risk level
                if predicted_category in high_risk_categories or category_confidence > 0.8:
                    risk_level = "High"
                    risk_score = min(0.9, 0.6 + (category_confidence * 0.3))
                elif predicted_category in medium_risk_categories or category_confidence > 0.5:
                    risk_level = "Medium"
                    risk_score = 0.3 + (category_confidence * 0.4)
                else:
                    risk_level = "Low"
                    risk_score = category_confidence * 0.3
                
                risk_counts[risk_level] += 1
                
                if risk_level in ['High', 'Medium']:
                    risk_analysis.append({
                        'id': report.id,
                        'incident_type': report.incident_type,
                        'predicted_category': predicted_category,
                        'category_confidence': round(category_confidence, 3),
                        'barangay': report.barangay,
                        'risk_score': round(risk_score, 3),
                        'risk_level': risk_level,
                        'created_at': report.created_at
                    })
            
            # Sort by risk score descending
            risk_analysis.sort(key=lambda x: x['risk_score'], reverse=True)
            
            return Response({
                'total_analyzed': len(queryset),
                'risk_distribution': risk_counts,
                'high_priority_reports': risk_analysis[:10],
                'ai_insights': {
                    'high_risk_percentage': round((risk_counts['High'] / len(queryset)) * 100, 1),
                    'requires_attention': risk_counts['High'] + risk_counts['Medium'],
                    'most_common_high_risk_type': self._get_most_common_type(
                        [r for r in risk_analysis if r['risk_level'] == 'High']
                    )
                }
            })
            
        except Exception as e:
            logger.error(f"Error in AI summary: {str(e)}")
            return Response(
                {'error': 'AI summary failed', 'details': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _extract_report_features(self, report):
        """Extract features from a report for ML model (544 features)"""
        # Import the analytics feature extraction function
        from analytics.views import extract_report_features
        return extract_report_features(report)
    
    def _get_most_common_type(self, reports):
        """Get the most common incident type from a list of reports"""
        if not reports:
            return "None"
        
        type_counts = {}
        for report in reports:
            incident_type = report['incident_type']
            type_counts[incident_type] = type_counts.get(incident_type, 0) + 1
        
        return max(type_counts, key=type_counts.get) if type_counts else "None"

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

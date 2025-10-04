from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404

from .models import Report, Category, ReportAction
from .serializers import ReportSerializer, ReportListSerializer, CategorySerializer

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

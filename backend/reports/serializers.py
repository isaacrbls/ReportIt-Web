from rest_framework import serializers
from .models import Report, Category, ReportAction

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'is_active', 'created_at']

class ReportActionSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = ReportAction
        fields = ['id', 'action_type', 'user_email', 'notes', 'old_status', 'new_status', 'created_at']

class ReportSerializer(serializers.ModelSerializer):
    submitted_by_username = serializers.CharField(source='submitted_by.username', read_only=True)
    verified_by_username = serializers.CharField(source='verified_by.username', read_only=True)
    actions = ReportActionSerializer(many=True, read_only=True)

    class Meta:
        model = Report
        fields = [
            'id', 'title', 'incident_type', 'description', 'barangay', 'latitude', 'longitude',
            'media', 'media_type', 'media_url', 'status', 'submitted_by', 'submitted_by_email', 
            'submitted_by_username', 'is_sensitive', 'has_media', 'verified_by', 'verified_by_username',
            'verified_at', 'created_at', 'updated_at', 'actions'
        ]
        read_only_fields = ['submitted_by', 'verified_by', 'verified_at', 'has_media']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['submitted_by'] = request.user
            validated_data['submitted_by_email'] = request.user.email
        return super().create(validated_data)

class ReportListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list views"""
    submitted_by_username = serializers.CharField(source='submitted_by.username', read_only=True)
    
    class Meta:
        model = Report
        fields = [
            'id', 'title', 'incident_type', 'barangay', 'latitude', 'longitude',
            'status', 'submitted_by_email', 'submitted_by_username', 'is_sensitive', 
            'has_media', 'created_at'
        ]

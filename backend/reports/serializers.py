from rest_framework import serializers
from .models import Report

class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = [
            'id', 'incident_type', 'description', 'barangay', 'latitude', 'longitude',
            'media', 'media_type', 'status', 'submitted_by_email', 'created_at'
        ]

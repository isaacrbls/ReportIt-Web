from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name

class Report(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Verified', 'Verified'),
        ('Under Investigation', 'Under Investigation'),
        ('Resolved', 'Resolved'),
        ('Rejected', 'Rejected'),
    ]
    
    MEDIA_CHOICES = [
        ('photo', 'Photo'),
        ('video', 'Video'),
    ]
    
    PRIORITY_CHOICES = [
        ('High', 'High'),
        ('Medium', 'Medium'),
        ('Low', 'Low'),
    ]
    
    RISK_LEVEL_CHOICES = [
        ('High', 'High'),
        ('Medium', 'Medium'),
        ('Low', 'Low'),
    ]

    title = models.CharField(max_length=200, default="")
    incident_type = models.CharField(max_length=200)
    description = models.TextField()
    barangay = models.CharField(max_length=100, blank=True, default="")
    latitude = models.FloatField()
    longitude = models.FloatField()
    media = models.FileField(upload_to='reports/', blank=True, null=True)
    media_type = models.CharField(max_length=20, choices=MEDIA_CHOICES, blank=True, default="")
    media_url = models.URLField(blank=True, null=True)  # For Firebase URLs during transition
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    submitted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='submitted_reports')
    submitted_by_email = models.EmailField(blank=True, null=True)  # For backward compatibility
    is_sensitive = models.BooleanField(default=False)
    has_media = models.BooleanField(default=False)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_reports')
    verified_at = models.DateTimeField(null=True, blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='Low')
    risk_level = models.CharField(max_length=10, choices=RISK_LEVEL_CHOICES, default='Low')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        self.has_media = bool(self.media or self.media_url)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.incident_type} - {self.barangay} ({self.created_at:%Y-%m-%d})"

class ReportAction(models.Model):
    ACTION_CHOICES = [
        ('created', 'Created'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
        ('status_changed', 'Status Changed'),
        ('updated', 'Updated'),
    ]

    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='actions')
    action_type = models.CharField(max_length=20, choices=ACTION_CHOICES)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    notes = models.TextField(blank=True)
    old_status = models.CharField(max_length=20, blank=True)
    new_status = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.action_type} - Report #{self.report.id}"

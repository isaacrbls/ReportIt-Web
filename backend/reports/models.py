from django.db import models


class Report(models.Model):
    incident_type = models.CharField(max_length=200)
    description = models.TextField()
    barangay = models.CharField(max_length=100, blank=True, default="")
    latitude = models.FloatField()
    longitude = models.FloatField()
    media = models.FileField(upload_to='reports/', blank=True, null=True)
    media_type = models.CharField(max_length=20, blank=True, default="")
    status = models.CharField(max_length=20, default='Pending')
    submitted_by_email = models.EmailField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.incident_type} - {self.barangay} ({self.created_at:%Y-%m-%d})"


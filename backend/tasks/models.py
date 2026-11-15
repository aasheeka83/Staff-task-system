import secrets
import os
import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone

from staff.models import Staff


def generate_token():
    return secrets.token_urlsafe(32)


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'categories'

    def __str__(self):
        return self.name


class Task(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        COMPLETED = 'COMPLETED', 'Completed'
        NOT_SUBMITTED = 'NOT_SUBMITTED', 'Not Submitted'

    title = models.CharField(max_length=200)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='tasks')
    description = models.TextField()
    deadline = models.DateTimeField()
    staff = models.ForeignKey(Staff, on_delete=models.PROTECT, related_name='tasks')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    token = models.CharField(max_length=64, unique=True, default=generate_token, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def submission_url(self):
        return f"{settings.FRONTEND_URL}/submit/{self.token}"

    @staticmethod
    def update_overdue():
        """Any PENDING task whose deadline has passed becomes NOT_SUBMITTED."""
        Task.objects.filter(
            status=Task.Status.PENDING,
            deadline__lt=timezone.now(),
        ).update(status=Task.Status.NOT_SUBMITTED)
        
def submission_upload_path(instance, filename):
        # Store files under a random name so the file URL cannot be guessed
        ext = os.path.splitext(filename)[1].lower()
        return f"submissions/{uuid.uuid4().hex}{ext}"


class Submission(models.Model):
        task = models.OneToOneField(Task, on_delete=models.PROTECT, related_name='submission')
        staff = models.ForeignKey(Staff, on_delete=models.PROTECT, related_name='submissions')
        comment = models.TextField()
        document = models.FileField(upload_to=submission_upload_path)
        original_filename = models.CharField(max_length=255, blank=True)
        submitted_at = models.DateTimeField(auto_now_add=True)

        def __str__(self):
            return f"Submission for {self.task.title}"
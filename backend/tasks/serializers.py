import os

from django.utils import timezone
from rest_framework import serializers

from .models import Category, Submission, Task

ALLOWED_EXTENSIONS = {'.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg', '.txt'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']


class TaskSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    staff_name = serializers.CharField(source='staff.full_name', read_only=True)
    submission_url = serializers.CharField(read_only=True)
    submission = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'category', 'category_name', 'description',
            'deadline', 'staff', 'staff_name', 'status',
            'submission_url', 'created_at', 'submission',
        ]
        read_only_fields = ['id', 'status', 'created_at']

    def get_submission(self, task):
        submission = getattr(task, 'submission', None)
        if not submission:
            return None
        return {
            'comment': submission.comment,
            'submitted_at': submission.submitted_at,
            'filename': submission.original_filename,
            'document_url': f'/api/tasks/{task.pk}/document/',
        }

    def validate_staff(self, staff):
        if not staff.is_active:
            raise serializers.ValidationError('This staff member is inactive.')
        return staff

    def validate_deadline(self, value):
        if self.instance is None and value <= timezone.now():
            raise serializers.ValidationError('Deadline must be in the future.')
        return value


class SubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = ['comment', 'document', 'submitted_at']
        read_only_fields = ['submitted_at']

    def validate_comment(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Please add a submission comment.')
        return value

    def validate_document(self, file):
        ext = os.path.splitext(file.name)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            allowed = ', '.join(sorted(ALLOWED_EXTENSIONS))
            raise serializers.ValidationError(f'File type not allowed. Allowed types: {allowed}')
        if file.size > MAX_FILE_SIZE:
            raise serializers.ValidationError('File is too large. Maximum size is 10 MB.')
        return file

    def create(self, validated_data):
        validated_data['original_filename'] = validated_data['document'].name
        return super().create(validated_data)
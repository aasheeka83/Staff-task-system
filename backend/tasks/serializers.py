from django.utils import timezone
from rest_framework import serializers

from .models import Category, Task


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']


class TaskSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    staff_name = serializers.CharField(source='staff.full_name', read_only=True)
    submission_url = serializers.CharField(read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'category', 'category_name', 'description',
            'deadline', 'staff', 'staff_name', 'status',
            'submission_url', 'created_at',
        ]
        read_only_fields = ['id', 'status', 'created_at']

    def validate_staff(self, staff):
        if not staff.is_active:
            raise serializers.ValidationError('This staff member is inactive.')
        return staff

    def validate_deadline(self, value):
        if self.instance is None and value <= timezone.now():
            raise serializers.ValidationError('Deadline must be in the future.')
        return value
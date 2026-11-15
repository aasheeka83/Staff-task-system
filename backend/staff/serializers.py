from rest_framework import serializers
from .models import Staff


class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = ['id', 'full_name', 'email', 'phone', 'role', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']
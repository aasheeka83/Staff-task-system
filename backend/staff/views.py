from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Staff
from .serializers import StaffSerializer


class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.all()
    serializer_class = StaffSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['full_name', 'email', 'phone', 'role']

    @action(detail=True, methods=['get'])
    def details(self, request, pk=None):
        from tasks.models import Task
        from tasks.serializers import TaskSerializer

        staff = self.get_object()
        Task.update_overdue()
        tasks = staff.tasks.select_related('category', 'submission')

        data = StaffSerializer(staff).data
        data.update({
            'total_tasks': tasks.count(),
            'pending_tasks': tasks.filter(status=Task.Status.PENDING).count(),
            'completed_tasks': tasks.filter(status=Task.Status.COMPLETED).count(),
            'not_submitted_tasks': tasks.filter(status=Task.Status.NOT_SUBMITTED).count(),
            'task_history': TaskSerializer(tasks, many=True, context={'request': request}).data,
        })
        return Response(data)
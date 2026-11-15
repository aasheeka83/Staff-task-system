from django.db import transaction
from django.db.models import ProtectedError
from django.http import FileResponse
from rest_framework import filters, mixins, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .emails import send_task_email
from .models import Category, Task
from .serializers import CategorySerializer, SubmissionSerializer, TaskSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {'detail': 'This category is used by existing tasks and cannot be deleted.'},
                status=400,
            )


class TaskViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = TaskSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'staff__full_name', 'category__name']

    def get_queryset(self):
        Task.update_overdue()
        queryset = Task.objects.select_related('category', 'staff', 'submission')

        status = self.request.query_params.get('status')
        if status:
            status = status.upper()
            if status == 'OVERDUE':
                status = 'NOT_SUBMITTED'
            queryset = queryset.filter(status=status)
        return queryset

    def perform_create(self, serializer):
        task = serializer.save()
        send_task_email(task)

    @action(detail=True, methods=['get'])
    def document(self, request, pk=None):
        """Admin-only: view the submitted file, or add ?download=1 to download it."""
        task = self.get_object()
        submission = getattr(task, 'submission', None)
        if not submission:
            raise NotFound('No document has been submitted for this task.')

        download = request.query_params.get('download') == '1'
        return FileResponse(
            submission.document.open('rb'),
            as_attachment=download,
            filename=submission.original_filename,
        )


class DashboardView(APIView):
    def get(self, request):
        Task.update_overdue()
        tasks = Task.objects.all()
        not_submitted = tasks.filter(status=Task.Status.NOT_SUBMITTED).count()

        recent = Task.objects.select_related('category', 'staff', 'submission')[:5]

        return Response({
            'total_tasks': tasks.count(),
            'pending_tasks': tasks.filter(status=Task.Status.PENDING).count(),
            'completed_tasks': tasks.filter(status=Task.Status.COMPLETED).count(),
            'not_submitted_tasks': not_submitted,
            'overdue_tasks': not_submitted,
            'recent_tasks': TaskSerializer(recent, many=True, context={'request': request}).data,
        })


class SubmitTaskView(APIView):
    """Public endpoint used by staff through the emailed link. No login needed."""
    authentication_classes = []
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    not_found = {'detail': 'This submission link is invalid.'}

    def get(self, request, token):
        Task.update_overdue()
        task = Task.objects.select_related('category', 'staff').filter(token=token).first()
        if not task:
            return Response(self.not_found, status=404)

        return Response({
            'title': task.title,
            'category': task.category.name,
            'description': task.description,
            'assigned_date': task.created_at,
            'deadline': task.deadline,
            'status': task.status,
            'staff_name': task.staff.full_name,
            'can_submit': task.status == Task.Status.PENDING,
        })

    def post(self, request, token):
        Task.update_overdue()

        with transaction.atomic():
            task = Task.objects.select_for_update().filter(token=token).first()
            if not task:
                return Response(self.not_found, status=404)

            if task.status == Task.Status.COMPLETED:
                return Response({'detail': 'This task has already been submitted.'}, status=400)
            if task.status == Task.Status.NOT_SUBMITTED:
                return Response({'detail': 'The deadline has passed. This task can no longer be submitted.'}, status=400)

            serializer = SubmissionSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(task=task, staff=task.staff)

            task.status = Task.Status.COMPLETED
            task.save(update_fields=['status'])

        return Response({'detail': 'Task submitted successfully.'}, status=201)
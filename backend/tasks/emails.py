from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone


def send_task_email(task):
    deadline = timezone.localtime(task.deadline).strftime('%d %b %Y, %I:%M %p')

    subject = f"New task assigned: {task.title}"
    message = (
        f"Hello {task.staff.full_name},\n\n"
        f"A new task has been assigned to you.\n\n"
        f"Title: {task.title}\n"
        f"Category: {task.category.name}\n"
        f"Description: {task.description}\n"
        f"Deadline: {deadline}\n"
        f"Status: {task.get_status_display()}\n\n"
        f"Submit your work here:\n{task.submission_url}\n\n"
        f"Please do not share this link with anyone else."
    )

    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [task.staff.email])
        return True
    except Exception as error:
        print("Email failed:", error)
        return False
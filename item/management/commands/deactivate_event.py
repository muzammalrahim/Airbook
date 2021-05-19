from django.core.management.base import BaseCommand, CommandError
from item.models import AbEvents
from datetime import datetime, timedelta

class Command(BaseCommand):
    help = 'Make event inactive after event end date gone'

    def handle(self, *args, **options):
        AbEvents.objects.filter(end_date__lt=datetime.today()).update(is_active=0)

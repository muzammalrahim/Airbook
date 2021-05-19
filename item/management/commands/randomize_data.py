from django.core.management.base import BaseCommand, CommandError
from item.models import AbAircrafts
from datetime import datetime, timedelta

class Command(BaseCommand):
    help = 'Change data sorting column for all frontend listing'

    def handle(self, *args, **options):
        AbAircrafts.objects.update(order=)
        AbEngines.objects.update(order=)
        AbApus.objects.update(order=)
        AbParts.objects.update(order=)
        AbWanteds.objects.update(order=)
        AbContacts.objects.update(order=)
        AbCompanies.objects.update(order=)
        AbAirports.objects.update(order=)

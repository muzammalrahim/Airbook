from django.contrib.sitemaps import Sitemap

from item import models as item_models
from connect import models as connect_models


class AircraftSitemap(Sitemap):
    name = 'aircraft'
    changefreq = 'daily'
    limit = 50000

    def items(self):
        return item_models.AbAircrafts.objects\
        .filter(deleted_at=None, isactivestatus='Approved', is_active_by_user=1)\
        .order_by('id')

    def lastmod(self, obj):
        return obj.updated_at


class EngineSitemap(Sitemap):
    name = 'engine'
    changefreq = 'daily'
    limit = 50000

    def items(self):
        return item_models.AbEngines.objects\
        .filter(deleted_at=None, isactivestatus='Approved', is_active_by_user=1)\
        .order_by('id')

    def lastmod(self, obj):
        return obj.updated_at


class ApuSitemap(Sitemap):
    name = 'apu'
    changefreq = 'daily'
    limit = 50000

    def items(self):
        return item_models.AbApus.objects\
        .filter(deleted_at=None, isactivestatus='Approved', is_active_by_user=1)\
        .order_by('id')

    def lastmod(self, obj):
        return obj.updated_at


class PartSitemap(Sitemap):
    name = 'part'
    changefreq = 'daily'
    limit = 50000

    def items(self):
        return item_models.AbParts.objects\
        .filter(deleted_at=None, is_active=1)\
        .order_by('id')

    def lastmod(self, obj):
        return obj.updated_at


class WantedSitemap(Sitemap):
    name = 'wanted'
    changefreq = 'daily'
    limit = 50000

    def items(self):
        return item_models.AbWanteds.objects\
        .filter(deleted_at=None, is_published=1, is_active=1)\
        .order_by('id')

    def lastmod(self, obj):
        return obj.updated_at


class ContactSitemap(Sitemap):
    name = 'contact'
    changefreq = 'daily'
    limit = 50000

    def items(self):
        return connect_models.AbContacts.objects\
        .filter(deleted_at=None, is_published=1)\
        .order_by('id')

    def lastmod(self, obj):
        return obj.updated_at


class CompanySitemap(Sitemap):
    name = 'company'
    changefreq = 'daily'
    limit = 50000

    def items(self):
        return connect_models.AbCompanies.objects\
        .filter(deleted_at=None, is_active=1)\
        .order_by('id')

    def lastmod(self, obj):
        return obj.updated_at


class AirportSitemap(Sitemap):
    name = 'airport'
    changefreq = 'daily'
    limit = 50000

    def items(self):
        return item_models.AbAirports.objects\
        .filter(deleted_at=None, is_active=1)\
        .order_by('id')

    def lastmod(self, obj):
        return obj.updated_at





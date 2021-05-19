"""airbook URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static


from django.urls import include, path
from rest_framework import routers
from account import views as account_views
from connect import views as connect_views
from item import views as item_views

from django.contrib.sitemaps import views
from default.sitemaps import AircraftSitemap, EngineSitemap, ApuSitemap, PartSitemap,\
WantedSitemap, ContactSitemap, CompanySitemap, AirportSitemap

sitemaps = {
    AircraftSitemap.name: AircraftSitemap,
    EngineSitemap.name: EngineSitemap,
    ApuSitemap.name: ApuSitemap,
    PartSitemap.name: PartSitemap,
    WantedSitemap.name: WantedSitemap,
    ContactSitemap.name: ContactSitemap,
    CompanySitemap.name: CompanySitemap,
    AirportSitemap.name: AirportSitemap,
}

router = routers.DefaultRouter()
router.register(r'users', account_views.UserViewSet)


urlpatterns = [
    path('sitemap.xml', views.index, {
        'sitemaps': sitemaps,
        # 'template_name': 'seo/sitemap.html'
    },
         name='sitemap-index'),
    path('sitemap-<section>.xml', views.sitemap, {
        'sitemaps': sitemaps,
        'template_name': 'seo/sitemap.html'
        },
         name='django.contrib.sitemaps.views.sitemap'),

    # path('_admin/', admin.site.urls),
    # re_path(r'^(?:.*)/?$', include('account.urls')),
    path('api/', include('api.urls')),
    path('api/home_contents', item_views.home_contents),
    path('api/changepassword', account_views.change_password),
    path('api/user_dashboard', account_views.user_dashboard),
    path('api/admin_dashboard', account_views.admin_dashboard),
    path('api/import', account_views.import_data),

    path('paytab/callback', item_views.paytab_callback),
    path('', include('account.urls')),

]
urlpatterns += [
    path('api-auth/', include('rest_framework.urls')),

]
if settings.DEBUG:
    # urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

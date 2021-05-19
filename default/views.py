from rest_framework.views import APIView
from rest_framework import viewsets,filters, generics, status, authentication
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework_datatables.filters import DatatablesFilterBackend
from django.db.models import Q
import json, decimal
from rest_framework import HTTP_HEADER_ENCODING, exceptions
from django.utils.translation import gettext_lazy as _
from account.models import AbUsers


class CustomTokenAuthentication(authentication.TokenAuthentication):    

    def authenticate_credentials(self, key):
        model = self.get_model()
        try:
            token = model.objects.select_related('user').get(key=key)
        except model.DoesNotExist:
            return (AbUsers(), None)
            raise exceptions.AuthenticationFailed(_('Invalid token.'))

        if not token.user.is_active:
            raise exceptions.AuthenticationFailed(_('User inactive or deleted.'))

        return (token.user, token)

    def authenticate_header(self, request):
        return self.keyword


class CommonViewset(viewsets.ModelViewSet, generics.RetrieveAPIView):

    # authentication_classes = [CustomTokenAuthentication]

    def get_authenticators(self):
        """
        Instantiates and returns the list of authenticators that this view can use.
        """
        authenticators = super().get_authenticators()
        method = self.request.method.lower()
        if method == 'get':
            return [CustomTokenAuthentication()]
        else:
            return authenticators


    def filter_queryset(self, queryset):
        format = self.request.GET.get('format', None)

        if format == 'datatables':
            self.filter_backends += (DatatablesFilterBackend,)
        else:
            self.filter_backends += (DjangoFilterBackend,)
        for backend in list(self.filter_backends):
            queryset = backend().filter_queryset(self.request, queryset, self)
        return queryset


def isRoleUser(obj):
	if obj and obj.groups.filter(Q(name='User') | Q(name='user')).exists():
		return True
	else:
		return False

class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            return float(o)
        return super(DecimalEncoder, self).default(o)

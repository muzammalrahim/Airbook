from django.shortcuts import render
from info.models import *
from item.models import *
from info.serializers import *
from rest_framework import viewsets,filters, generics, status
from rest_framework.decorators import permission_classes
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.request import Request
from rest_framework.response import Response
import json, decimal
from django.forms.models import model_to_dict
from rest_framework_datatables.filters import DatatablesFilterBackend
from default.views import CommonViewset, DecimalEncoder
# Create your views here.

from rest_framework.status import (
	HTTP_400_BAD_REQUEST,
	HTTP_404_NOT_FOUND,
	HTTP_200_OK,
	HTTP_204_NO_CONTENT
)
from connect.views import safe_delete
from default.views import CommonViewset, CustomTokenAuthentication
from rest_framework.decorators import api_view, action, authentication_classes, permission_classes
from account.models import AbUsers, AbManufacturers, AbTypes, AbModels, AbTitles
from connect.models import AbContacts, AbDepartments, AbSpecialities, AbCities, AbStates
from django.contrib.auth.models import Group
from default.services import to_dict, getPlanNameAndType, isRoleUser
from default.PayPal import GetPayment
from django.db.models import F
from datetime import datetime
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django.db.models import Q

class CategoryViewSet(CommonViewset, generics.RetrieveAPIView):
	queryset = AbCategories.objects.filter(deleted_at=None)
	serializer_class = CategorySerializer

	filter_backends = (filters.OrderingFilter, filters.SearchFilter,)
	ordering_fields = ('id', 'name')
	filter_fields = ('id', 'is_active', 'type')
	search_fields = ('id', 'name')

	def get_queryset(self):
		queryset = AbCategories.objects.filter(deleted_at=None)
		is_active = self.request.query_params.get('is_active', None)
		if is_active is not None:
			queryset = queryset.filter(is_active=is_active)
		return queryset


	def list(self, request, *args, **kwargs):
		records = request.GET.get('records', None)
		queryset = self.filter_queryset(self.get_queryset())
		page = self.paginate_queryset(queryset)
		if page is not None and records is None:
			serializer = self.get_serializer(page, many=True)
			return self.get_paginated_response(serializer.data)
		serializer = self.get_serializer(queryset, many=True)
		return Response(serializer.data)

	def perform_create(self, serializer):
		return serializer.save()

	def create(self, request):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		self.perform_create(serializer)
		self.get_success_headers(serializer.data)
		return Response(serializer.data)

	def retrieve(self, request: Request, *args, **kwargs):
		instance = self.get_object()
		serializer = self.get_serializer(instance)
		data = serializer.data
		data['media'] = AbMedias.get_media(instance, 'App\\Category')
		return Response(data)

	def destroy(self, request, *args, **kwargs):
		resp = safe_delete(self, request, AbCategories)
		return resp


#######Ab          Configurations        ######
class ConfigurationViewSet(CommonViewset, generics.RetrieveAPIView):

	queryset = AbConfigurations.objects.filter(deleted_at=None)
	serializer_class = ConfigurationsSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	ordering_fields = ('id','name')
	filter_fields = ('id','is_active')
	search_fields = ('id','name')

	def list(self, request, *args, **kwargs):
		records = request.GET.get('records', None)
		queryset = self.filter_queryset(self.get_queryset())
		page = self.paginate_queryset(queryset)
		if page is not None and records is None:
			serializer = self.get_serializer(page, many=True)
			return self.get_paginated_response(serializer.data)
		serializer = self.get_serializer(queryset, many=True)
		return Response(serializer.data)

	def perform_create(self, serializer):
		return serializer.save()

	def create(self, request):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		self.perform_create(serializer)
		return Response(serializer.data)

	def retrieve(self, request: Request, *args, **kwargs):
		instance = self.get_object()
		serializer = self.get_serializer(instance)
		return Response(serializer.data)

	def destroy(self, request, *args, **kwargs):
		resp = safe_delete(self, request, AbConfigurations)
		return resp


class ReleasesViewSet(CommonViewset, generics.RetrieveAPIView):

	queryset = AbReleases.objects.filter(deleted_at=None)
	serializer_class = ReleasesSerializer
	filter_backends = (filters.OrderingFilter, filters.SearchFilter,)
	ordering_fields = ('id', 'name')
	filter_fields = ('id', 'is_active')
	search_fields = ('id', 'name')

	def list(self, request, *args, **kwargs):
		records = request.GET.get('records', None)
		queryset = self.filter_queryset(self.get_queryset())
		page = self.paginate_queryset(queryset)
		if page is not None and records is None:
			serializer = self.get_serializer(page, many=True)
			return self.get_paginated_response(serializer.data)
		serializer = self.get_serializer(queryset, many=True)
		return Response(serializer.data)

	def perform_create(self, serializer):
		return serializer.save()

	def retrieve(self, request: Request, *args, **kwargs):
		instance = self.get_object()
		serializer = self.get_serializer(instance)
		return Response(serializer.data)

	def destroy(self, request, *args, **kwargs):
		resp = safe_delete(self, request, AbReleases)
		return resp


class NewsViewSet(CommonViewset, generics.RetrieveAPIView):
	queryset = AbNews.objects.filter(deleted_at=None)
	serializer_class = NewsSerializer
	filter_backends = (filters.OrderingFilter, filters.SearchFilter, )
	ordering_fields = ('id', 'title','date','company__name')
	filter_fields = ('id', 'is_active')
	search_fields = ('id', 'title','date','company__name')

	def list(self, request, *args, **kwargs):
		queryset = self.filter_queryset(self.get_queryset())
		page = self.paginate_queryset(queryset)
		if page is not None:
			serializer = self.get_serializer(page, many=True)
			return self.get_paginated_response(serializer.data)
		serializer = self.get_serializer(queryset, many=True)
		return Response(serializer.data)

	def perform_create(self, serializer):
		return serializer.save()

	def retrieve(self, request: Request, *args, **kwargs):
		instance = self.get_object()
		serializer = self.get_serializer(instance)
		data = serializer.data
		data['media'] = AbMedias.get_media(instance, 'App\\News')

		related_models = ['country','region','continent']
		
		for model in related_models:
			try:
				data[model] = to_dict(getattr(instance, model))
			except:
				data[model] = None

		try:
			data['categories'] = instance.categories.values()
		except:
			data['categories'] = None
		return Response(data)

	def destroy(self, request, *args, **kwargs):
		resp = safe_delete(self, request, AbNews)
		return resp


class EmailsViewSet(CommonViewset, generics.RetrieveAPIView):
	queryset = AbCannedemails.objects.filter(deleted_at=None)
	serializer_class = EmailsSerializer
	filter_backends = (filters.OrderingFilter, filters.SearchFilter,)
	ordering_fields = ('id', 'subject', 'message_type')
	filter_fields = ('id', 'is_active')
	search_fields = ('id', 'subject', 'message_type')

	def list(self, request, *args, **kwargs):
		records = request.GET.get('records', None)
		queryset = self.filter_queryset(self.get_queryset())
		page = self.paginate_queryset(queryset)
		if page is not None and records is None:
			serializer = self.get_serializer(page, many=True)
			return self.get_paginated_response(serializer.data)
		serializer = self.get_serializer(queryset, many=True)
		return Response(serializer.data)

	def perform_create(self, serializer):
		return serializer.save()

	def retrieve(self, request: Request, *args, **kwargs):
		instance = self.get_object()
		serializer = self.get_serializer(instance)
		return Response(serializer.data)

	def destroy(self, request, *args, **kwargs):
		resp = safe_delete(self, request, AbCannedemails)
		return resp


class CmsViewSet(CommonViewset, generics.RetrieveAPIView):
	queryset = AbCms.objects.filter(deleted_at=None)
	serializer_class = CmsSerializer
	filter_backends = (filters.OrderingFilter, filters.SearchFilter,)
	ordering_fields = ('id', 'title')
	filter_fields = ('id', 'is_active')
	search_fields = ('id', 'title')
	permission_classes = [IsAuthenticatedOrReadOnly]

	def list(self, request, *args, **kwargs):
		records = request.GET.get('records', None)
		queryset = self.filter_queryset(self.get_queryset())
		page = self.paginate_queryset(queryset)
		if page is not None and records is None:
			serializer = self.get_serializer(page, many=True)
			return self.get_paginated_response(serializer.data)
		serializer = self.get_serializer(queryset, many=True)
		return Response(serializer.data)

	def perform_create(self, serializer):
		return serializer.save()

	def retrieve(self, request: Request, *args, **kwargs):
		instance = self.get_object()
		serializer = self.get_serializer(instance)
		data = serializer.data
		data['media'] = AbMedias.get_media(instance, 'App\\Cms')
		return Response(data)

	def destroy(self, request, *args, **kwargs):
		resp = safe_delete(self, request, AbCms)
		return resp


class SeoViewSet(CommonViewset, generics.RetrieveAPIView):
	queryset = AbSeos.objects.filter(deleted_at=None)
	serializer_class = SeoSerializer
	filter_backends = (filters.OrderingFilter, filters.SearchFilter, )
	ordering_fields = ('id', 'title')
	filter_fields = ('id', 'is_active', 'model_type')
	search_fields = ('id', 'title')
	permission_classes = [IsAuthenticatedOrReadOnly]

	def list(self, request, *args, **kwargs):
		records = request.GET.get('records', None)
		queryset = self.filter_queryset(self.get_queryset())
		page = self.paginate_queryset(queryset)
		if page is not None and records is None:
			serializer = self.get_serializer(page, many=True)
			return self.get_paginated_response(serializer.data)
		serializer = self.get_serializer(queryset, many=True)
		return Response(serializer.data)

	def perform_create(self, serializer):
		return serializer.save()

	def retrieve(self, request: Request, *args, **kwargs):
		instance = self.get_object()
		serializer = self.get_serializer(instance)
		data = serializer.data
		data['media'] = AbMedias.get_media(instance, 'App\\Seo')
		return Response(data)

	def destroy(self, request, *args, **kwargs):
		resp = safe_delete(self, request, AbSeos)
		return resp


class PaymenthistoriesViewSet(CommonViewset, generics.RetrieveAPIView):
	queryset = AbPaymentHistories.objects.filter(deleted_at=None)
	serializer_class = PaymenthistoriesSerializer
	filter_backends = (filters.OrderingFilter, filters.SearchFilter,)
	ordering_fields = ('id',)
	filter_fields = ('id',)
	search_fields = ('id',)
	lookup_field = 'transaction_id'

	def list(self, request, *args, **kwargs):
		
		records = request.GET.get('records', None)
		queryset = self.filter_queryset(self.get_queryset())
		if isRoleUser(request.user):
			queryset = AbPaymentHistories.objects.filter(deleted_at=None).filter(user=request.user)
				
		print("queryset", queryset)
		page = self.paginate_queryset(queryset)
		if page is not None and records is None:
			serializer = self.get_serializer(page, many=True)
			return self.get_paginated_response(serializer.data)
		serializer = self.get_serializer(queryset, many=True)
		return Response(serializer.data)

	def perform_create(self, serializer):
		return serializer.save()

	def retrieve(self, request: Request, *args, **kwargs):
		instance = self.get_object()
		serializer = self.get_serializer(instance).data
		return Response(serializer)

	def destroy(self, request, *args, **kwargs):
		resp = safe_delete(self, request, AbPaymentHistories, 'transaction_id')
		return resp


	@action(detail=False, methods=['POST'], name='update_payment')
	def update_payment(self, request, *args, **kwargs):
		paymentID = request.data.get('paymentID', None)
		payment = GetPayment()
		response = payment.get_payment(paymentID)

		if not AbPaymentHistories.objects.filter(payment_id=paymentID):
			credits = AbCredits.objects.filter(user=request.user)

			user_credits = []
			for credit in credits:
				user_credits.append({'type':credit.pricing.name, 'quantity': credit.cart_val, 'unit_price':decimal.Decimal(credit.pricing.price)})

			transaction_id = response.transactions[0].related_resources[0].sale.id
			AbPaymentHistories(
				user=request.user,
				payment_id=paymentID,
				payer_id=response.payer.payer_info.payer_id,
				transaction_id=response.transactions[0].related_resources[0].sale.id,
				customer_name='{} {}'.format(response.payer.payer_info.first_name, response.payer.payer_info.last_name),
				customer_email=response.payer.payer_info.email,
				transaction_amount=response.transactions[0].amount.total,
				transaction_currency=response.transactions[0].amount.currency,
				customer_phone=response.payer.payer_info.phone,
				trans_date=datetime.strptime(response.create_time, '%Y-%m-%dT%H:%M:%SZ'),
				pt_token=request.data.get('paymentToken', ''),
				payment_status=response.payer.status,
				status=1,
				credits=json.dumps(user_credits, cls=DecimalEncoder)
				# pt_customer_email=request.POST.get('response_code',''),
				# pt_customer_password=request.POST.get('response_code',''),
			).save()

			if response.payer.status == 'VERIFIED':
				credits.update(value=F('value')+F('cart_val'), cart_val=0)
				response = {'type':'success', 'message':'Credits has been purchased successfully', 'transaction_id':transaction_id}
			else:
				response = {'type':'error', 'message':'Payment is not verified'}
		else:
			response = {'type':'error', 'message':'Unknow error occur'}

		return Response(response, status=HTTP_200_OK)


class MediasViewSet(viewsets.ModelViewSet, generics.RetrieveAPIView):
	queryset = AbMedias.objects.order_by('-created_at')
	serializer_class = MediasSerializer
	filter_backends = (filters.OrderingFilter, filters.SearchFilter, DjangoFilterBackend,)
	ordering_fields = ('id','meta_name','created_at' )
	filter_fields = ('id','mediable_type',)
	search_fields = ('id','meta_name')

	def list(self, request, *args, **kwargs):
		queryset = self.filter_queryset(self.get_queryset())
		media_type = request.GET.get('mediable_type', None)
		mediableId = request.GET.get('mediableId', None)
		if media_type == 'App\\User':
			if not request.user.groups.filter(name = 'Admin').exists():
				mediable_id = request.user.id
			queryset = queryset.filter(mediable_id=mediableId)
		elif media_type == 'Global':
			queryset = queryset.filter(mediable_id=1)
		# page = self.paginate_queryset(queryset)
		# if page is not None:
		#     serializer = self.get_serializer(page, many=True)
		#     return self.get_paginated_response(serializer.data)
		serializer = self.get_serializer(queryset, many=True)
		return Response(serializer.data)

	def perform_create(self, serializer):
		return serializer.save()

	def retrieve(self, request: Request, *args, **kwargs):
		instance = self.get_object()
		serializer = self.get_serializer(instance)
		return Response(serializer.data)

	def destroy(self, request, *args, **kwargs):
		request_data = json.loads(request.body.decode('utf-8'))
		if 'ids' in request_data:
			# delete images files
			for id_ in request_data['ids']:
				abmedia = AbMedias.objects.get(id=id_)
				abmedia._delete_file()
				
			AbMedias.objects.filter(id__in=request_data['ids']).delete()
			return Response(status=HTTP_204_NO_CONTENT)
		else:
			return super(MediasViewSet, self).destroy(request, *args, **kwargs)


class AdvertisementsViewSet(CommonViewset, generics.RetrieveAPIView):
	queryset = AbAdvertisements.objects.filter(deleted_at=None)
	serializer_class = AdvertisementsSerializer
	filter_backends = (filters.OrderingFilter, filters.SearchFilter,)
	ordering_fields = ('id',)
	filter_fields = ('id','is_active','section')
	search_fields = ('id',)
	permission_classes = [IsAuthenticatedOrReadOnly]

	def list(self, request, *args, **kwargs):
		queryset = self.filter_queryset(self.get_queryset())
		
		# code for return random advertisement for top, side, bottom page
		section = request.GET.get('section')
		import random
		if section:
			queryset = queryset.filter(section=section)
			if queryset.exists():
				queryset = random.choice(queryset)
			serializer = self.get_serializer(queryset)
			return Response(serializer.data)

		else:
			page = self.paginate_queryset(queryset)
			if page is not None:
				serializer = self.get_serializer(page, many=True)
				return self.get_paginated_response(serializer.data)
			serializer = self.get_serializer(queryset, many=True)
			return Response(serializer.data)

	def perform_create(self, serializer):
		return serializer.save()

	def retrieve(self, request: Request, *args, **kwargs):
		instance = self.get_object()
		serializer = self.get_serializer(instance)
		data = serializer.data
		data['media'] = AbMedias.get_media(instance, 'App\\Advertisements')
		return Response(data)

	def destroy(self, request, *args, **kwargs):
		resp = safe_delete(self, request, AbAdvertisements)
		return resp


class PlansViewSet(viewsets.ModelViewSet, generics.RetrieveAPIView):
	queryset = AbPlans.objects.filter(deleted_at=None)
	serializer_class = PlansSerializer
	filter_backends = (filters.OrderingFilter, filters.SearchFilter, DjangoFilterBackend,)
	ordering_fields = ('id','title')
	filter_fields = ('id','is_active')
	search_fields = ('id','title')

	def list(self, request, *args, **kwargs):
		queryset = self.filter_queryset(self.get_queryset())
		page = self.paginate_queryset(queryset)
		if page is not None:
			serializer = self.get_serializer(page, many=True)
			return self.get_paginated_response(serializer.data)
		serializer = self.get_serializer(queryset, many=True)
		return Response(serializer.data)

	def perform_create(self, serializer):
		return serializer.save()

	def retrieve(self, request: Request, *args, **kwargs):
		instance = self.get_object()
		serializer = self.get_serializer(instance)
		data = serializer.data
		data['media'] = AbMedias.get_media(instance, 'App\\Plans')
		return Response(data)

	def destroy(self, request, *args, **kwargs):
		resp = safe_delete(self, request, AbPlans)
		return resp


class PointsViewSet(viewsets.ModelViewSet, generics.RetrieveAPIView):
	queryset = AbPoints.objects.filter(deleted_at=None)
	serializer_class = PointsSerializer
	filter_backends = (filters.OrderingFilter, filters.SearchFilter, DjangoFilterBackend,)
	ordering_fields = ('id','plan__name','plane__title')
	filter_fields = ('id',)
	search_fields = ('id','plan__name','plane__title')

	def list(self, request, *args, **kwargs):
		queryset = self.filter_queryset(self.get_queryset())
		page = self.paginate_queryset(queryset)
		if page is not None:
			serializer = self.get_serializer(page, many=True)
			return self.get_paginated_response(serializer.data)
		serializer = self.get_serializer(queryset, many=True)
		return Response(serializer.data)

	def perform_create(self, serializer):
		return serializer.save()

	def retrieve(self, request: Request, *args, **kwargs):
		instance = self.get_object()
		serializer = self.get_serializer(instance)
		return Response(serializer.data)

	def destroy(self, request, *args, **kwargs):
		resp = safe_delete(self, request, AbPoints)
		return resp


class AttachesViewSet(viewsets.ModelViewSet, generics.RetrieveAPIView):
	queryset = AbAttaches.objects.filter(deleted_at=None)
	serializer_class = AttachesSerializer
	filter_backends = (filters.OrderingFilter, filters.SearchFilter, DjangoFilterBackend,)
	ordering_fields = ('id')
	filter_fields = ('id',)
	search_fields = ('id',)

	def list(self, request, *args, **kwargs):
		queryset = self.filter_queryset(self.get_queryset())
		page = self.paginate_queryset(queryset)
		if page is not None:
			serializer = self.get_serializer(page, many=True)
			return self.get_paginated_response(serializer.data)
		serializer = self.get_serializer(queryset, many=True)
		return Response(serializer.data)

	def perform_create(self, serializer):
		return serializer.save()

	def retrieve(self, request: Request, *args, **kwargs):
		instance = self.get_object()
		serializer = self.get_serializer(instance)
		return Response(serializer.data)

	def destroy(self, request, *args, **kwargs):
		resp = safe_delete(self, request, AbAttachments)
		return resp

@api_view(['POST'])
@permission_classes((AllowAny,))
@authentication_classes([CustomTokenAuthentication,])
def abmodels(request):
	# import time
	# time.sleep(2)
	models = request.data.get('models')
	
	allowed_models = [
		'AbUsers','AbCategories','AbContacts','AbConfigurations','AbManufacturers',
		'AbCountries','AbCompanies','AbTypes','AbModels', 'AbConditions', 'AbReleases',
		'AbDepartments', 'AbTitles', 'AbSpecialities', 'AbContinents', 'AbRegions', 'AbStates', 'AbCities',
		'AbAirfieldTypes', 'Group']

	output = {}
	for model in models:
		 # duplicated models will end by __{keyword}
		ending = None
		if '__' in model: 
			model_, ending = model.split('__')
		else:
			model_ = model
		# check if model is allowed 
		if model_ in allowed_models:
			abmodel = globals()[model_] # make model object
			if model == 'Group':
				queryset = abmodel.objects.filter()
			else:
				queryset = abmodel.objects.filter(deleted_at=None)

			
			if model == 'AbCompanies':
				abmodel = AbCompanies
				queryset = abmodel.objects.filter(deleted_at=None, status=1, is_active=1, is_published=1)

			# special case for user currently
			if model == 'AbUsers':
				abmodel = AbContacts
				queryset = abmodel.objects.filter(deleted_at=None).exclude(user=None).filter(user__groups__name__in=['user','User'])

			if model == 'AbContacts' and isRoleUser(request.user):
				queryset = abmodel.objects.filter(deleted_at=None).filter(creator=request.user)
				
			# check if model has field is_active
			if hasattr(abmodel, 'is_active'):
				queryset = queryset.filter(is_active=1)
			# apply filters on base of user params
			kwargs = {}
			maxLength = None 
			for param in models[model]:
				if param == 'length':
					maxLength = models[model][param]
					continue
				# check if model has field mentionend in param
				# if hasattr(abmodel, param): # not work for many to many related field :(
				try:
					kwargs['{}'.format(param)] = models[model][param]
				except:
					pass
			if kwargs:
				queryset = queryset.filter(**kwargs)

			if maxLength is not None:
				queryset = queryset[:maxLength]
	
			# default_option = [{"id" : "", "name" : "--None--"}]
			# output[model] = default_option + list(queryset.values())
			output[model] = queryset.values()
	return Response(output, status=HTTP_200_OK)


@api_view(['POST'])
@permission_classes((AllowAny,))
@authentication_classes([CustomTokenAuthentication,])
def abmodels_related(request):
	# import time
	# time.sleep(2)
	models = request.data.get('models')
	
	allowed_models = [
		'AbUsers','AbCategories','AbContacts','AbConfigurations','AbManufacturers',
		'AbCountries','AbCompanies','AbTypes','AbModels', 'AbConditions', 'AbReleases',
		'AbDepartments', 'AbTitles', 'AbSpecialities', 'AbContinents', 'AbRegions', 'AbStates', 'AbCities',
		'AbAirfieldTypes', 'Group']

	output = {}
	for model in models:
		 # duplicated models will end by __{keyword}
		ending = None
		if '__' in model: 
			model_, ending = model.split('__')
		else:
			model_ = model
		# check if model is allowed 
		if model_ in allowed_models:
			abmodel = globals()[model_] # make model object
			queryset = abmodel.objects.filter(deleted_at=None)

			if model_ == 'AbConfigurations':
				queryset = queryset.filter(id__in=AbAircrafts.objects.filter(isactivestatus='Approved',deleted_at=None).values_list('configuration_id', flat=True))
			elif model_ in 'AbCategories':
				queryset = queryset.filter(
					Q(id__in=AbAircrafts.objects.filter(isactivestatus='Approved',deleted_at=None).values_list('category_id', flat=True)) |
					Q(id__in=AbEngines.objects.filter(isactivestatus='Approved',deleted_at=None).values_list('category_id', flat=True)) |
					Q(id__in=AbApus.objects.filter(isactivestatus='Approved',deleted_at=None).values_list('category_id', flat=True)),
				)
			elif model_ == 'AbManufacturers':
				queryset = queryset.filter(
					Q(id__in=AbAircrafts.objects.filter(isactivestatus='Approved',deleted_at=None).values_list('manufacturer_id', flat=True)) |
					Q(id__in=AbEngines.objects.filter(isactivestatus='Approved',deleted_at=None).values_list('manufacturer_id', flat=True)) |
					Q(id__in=AbApus.objects.filter(isactivestatus='Approved',deleted_at=None).values_list('manufacturer_id', flat=True)),
				)
			elif model_ == 'AbTypes':
				queryset = queryset.filter(
					Q(id__in=AbAircrafts.objects.filter(isactivestatus='Approved',deleted_at=None).values_list('type_id', flat=True)) |
					Q(id__in=AbEngines.objects.filter(isactivestatus='Approved',deleted_at=None).values_list('type_id', flat=True)) |
					Q(id__in=AbApus.objects.filter(isactivestatus='Approved',deleted_at=None).values_list('type_id', flat=True)),
				)
			elif model_ == 'AbModels':
				queryset = queryset.filter(
					Q(id__in=AbAircrafts.objects.filter(isactivestatus='Approved',deleted_at=None).values_list('model_id', flat=True)) |
					Q(id__in=AbEngines.objects.filter(isactivestatus='Approved',deleted_at=None).values_list('model_id', flat=True)) |
					Q(id__in=AbApus.objects.filter(isactivestatus='Approved',deleted_at=None).values_list('model_id', flat=True)),
				)
			# check if model has field is_active
			if hasattr(abmodel, 'is_active'):
				queryset = queryset.filter(is_active=1)

			# apply filters on base of user params
			kwargs = {}
			maxLength = None 
			for param in models[model]:
				if param == 'length':
					maxLength = models[model][param]
					continue
				# check if model has field mentionend in param
				# if hasattr(abmodel, param): # not work for many to many related field :(
				try:
					kwargs['{}'.format(param)] = models[model][param]
				except:
					pass
			if kwargs:
				queryset = queryset.filter(**kwargs)

			if maxLength is not None:
				queryset = queryset[:maxLength]
	
			# default_option = [{"id" : "", "name" : "--None--"}]
			# output[model] = default_option + list(queryset.values())
			output[model] = queryset.values()
	output['offer_for'] = AbAircrafts.objects.filter(isactivestatus='Approved',deleted_at=None).values_list('offer_for')
	output['offer_for'].union(AbEngines.objects.filter(isactivestatus='Approved',deleted_at=None).values_list('offer_for'))
	output['offer_for'].union(AbApus.objects.filter(isactivestatus='Approved',deleted_at=None).values_list('offer_for'))
	output['offer_for'] = output['offer_for'].distinct().values_list('offer_for',flat=True)
	return Response(output, status=HTTP_200_OK)

@api_view(['POST'])
@permission_classes((AllowAny,))
@authentication_classes([])
def filter_base_related_abmodels(request):
	# import time
	# time.sleep(2)
	models = request.data.get('models')
	filters = request.data.get('filters', None)
	current_model = request.data.get('current_model', None)
	related_name = request.data.get('related_name', None)
	kwargs = {}
	if related_name in ['contact','abwanteds']:
		kwargs = {"deleted_at":None, "is_published":1}
	elif related_name in ['airport','companies']:
		kwargs = {"deleted_at":None, "is_active":1}
	elif related_name in ['abaircrafts','abengines','abapus']:
		kwargs = {"deleted_at":None, "isactivestatus":"Approved","is_active_by_user":1}

	output = {}
	staticFilters = {related_name:{}}
	if related_name == 'abaircrafts':
		staticFilters[related_name]['status'] = {
			'name':'AIRCRAFT STATUS',
			'values' : [
				{ "name": 'Storage', "id": 'Storage' },
				{ "name": 'Parking', "id": 'Parking' },
				{ "name": 'Operational', "id": 'Operational' },
				{ "name": 'For Tear Down', "id": 'For Tear Down' }
			]
		}

	if related_name in ['abaircrafts','abengines','abapus']:
		staticFilters[related_name]['offer_for'] = {
			"name": 'OFFER FOR',
			"values": [
			  { "name": 'Sale', "id": 'Sale'},
			  { "name": 'ACMI', "id": 'ACMI'},
			  { "name": 'Dry Lease', "id": 'Dry Lease' },
			  { "name": 'Wet Lease', "id": 'Wet Lease' },
			  { "name": 'Lease Purchase', "id": 'Lease Purchase' },
			  { "name": 'Exchange', "id": 'Exchange' },
			  { "name": 'Charter', "id": 'Charter' }
			]
		}

	if related_name == 'abwanteds':
		staticFilters[related_name]['type'] = {
			"name": 'TYPE',
			"values": [
			  { "name": 'Aircraft', "id": 'Aircraft'},
			  { "name": 'Engine', "id": 'Engine'},
			  { "name": 'Apu', "id": 'Apu' },
			  { "name": 'Parts', "id": 'Parts' },
			]
		}
		staticFilters[related_name]['terms'] = {
			"name": 'WANTED TERMS',
			"values": [
			  { "name": 'ACMI', "id": 'ACMI'},
			  { "name": 'Dry Lease', "id": 'Dry Lease'},
			  { "name": 'Outright Purchase', "id": 'Outright Purchase'},
			  { "name": 'Lease', "id": 'Lease' },
			  { "name": 'Cash', "id": 'Cash' },
			]
		  }

	for filter_key in filters:
		if filters[filter_key]:
			try:
				if filter_key == 'yom_start':
					kwargs['yom__gte'] = filters[filter_key]
				elif filter_key == 'yom_end':
					kwargs['yom__lte'] = filters[filter_key]
				else:
					kwargs['{}__in'.format(filter_key)] = filters[filter_key]
			except:
				pass

	queryset = globals()[current_model].objects.filter(**kwargs)

	for key in staticFilters[related_name]:
		output[key] = []
		for i in range(len(staticFilters[related_name][key]['values'])):
			if queryset.filter(**{key:staticFilters[related_name][key]['values'][i]['id']}).exists():
				output[key].append(staticFilters[related_name][key]['values'][i])

	if related_name == 'abaircrafts':
		output['yom'] = queryset.exclude(yom=None).values_list('yom', flat=True).order_by('yom').distinct()
	elif related_name in ['abengines','abapus']:
		output['cycle_remaining'] = queryset.exclude(cycle_remaining=None).values_list('cycle_remaining', flat=True).order_by('cycle_remaining').distinct()

	ids = queryset.values_list('id', flat=True)

	allowed_models = [
		'AbCategories','AbContacts','AbConfigurations','AbManufacturers',
		'AbCountries','AbCompanies','AbTypes','AbModels', 'AbConditions', 'AbReleases',
		'AbDepartments', 'AbTitles', 'AbSpecialities', 'AbContinents', 'AbRegions', 'AbStates', 'AbCities',
		'AbAirfieldTypes']

	for model in models:
		 # duplicated models will end by __{keyword}
		ending = None
		if '__' in model: 
			model_, ending = model.split('__')
		else:
			model_ = model
		# check if model is allowed 
		if model_ in allowed_models:
			abmodel = globals()[model_] # make model object

			queryset = abmodel.objects.filter(deleted_at=None).filter(**{'{}__id__in'.format(related_name):ids}).distinct()

			# check if model has field is_active
			if hasattr(abmodel, 'is_active'):
				queryset = queryset.filter(is_active=1)
			# apply filters on base of user params
			kwargs = {}
			for param in models[model]:
				# check if model has field mentionend in param
				# if hasattr(abmodel, param): # not work for many to many related field :(
				try:
					kwargs['{}'.format(param)] = models[model][param]
				except:
					pass
			if kwargs:
				queryset = queryset.filter(**kwargs)
			# default_option = [{"id" : "", "name" : "--None--"}]
			# output[model] = default_option + list(queryset.values())
			output[model] = queryset.values()
	return Response(output, status=HTTP_200_OK)


@api_view(['POST'])
@permission_classes((AllowAny,))
@authentication_classes([CustomTokenAuthentication,])
def all_filter_base_related_abmodels(request):
	# import time
	# time.sleep(2)
	models = request.data.get('models')
	
	allowed_models = [
		'AbUsers','AbCategories','AbContacts','AbConfigurations','AbManufacturers',
		'AbCountries','AbCompanies','AbTypes','AbModels', 'AbConditions', 'AbReleases',
		'AbDepartments', 'AbTitles', 'AbSpecialities', 'AbContinents', 'AbRegions', 'AbStates', 'AbCities',
		'AbAirfieldTypes', 'Group']

	output = {}
	for model in models:
		 # duplicated models will end by __{keyword}
		ending = None
		if '__' in model: 
			model_, ending = model.split('__')
		else:
			model_ = model
		# check if model is allowed 
		if model_ in allowed_models:
			abmodel = globals()[model_] # make model object
			# check if model has field is_active
			if hasattr(abmodel, 'is_active'):
				queryset = queryset.filter(is_active=1)
			# apply filters on base of user params
			kwargs = {}
			maxLength = None 
			for param in models[model]:
				if param == 'length':
					maxLength = models[model][param]
					continue
				# check if model has field mentionend in param
				# if hasattr(abmodel, param): # not work for many to many related field :(
				try:
					kwargs['{}'.format(param)] = models[model][param]
				except:
					pass
			if kwargs:
				queryset = queryset.filter(**kwargs)
	
			# default_option = [{"id" : "", "name" : "--None--"}]
			# output[model] = default_option + list(queryset.values())
			output[model] = queryset.values()
	return Response(output, status=HTTP_200_OK)


class PricingViewSet(CommonViewset, generics.RetrieveAPIView):
	queryset = AbPricing.objects.all()
	serializer_class = AbPricingSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	filter_fields = ('id',)

	def list(self, request, *args, **kwargs):
		queryset = self.filter_queryset(self.get_queryset())
		page = self.paginate_queryset(queryset)
		if page is not None:
			serializer = self.get_serializer(page, many=True)
			return self.get_paginated_response(serializer.data)
		serializer = self.get_serializer(queryset, many=True)
		return Response(serializer.data)

	def perform_create(self, serializer):
		return serializer.save()

	def retrieve(self, request: Request, *args, **kwargs):
		instance = self.get_object()
		serializer = self.get_serializer(instance)
		data = serializer.data
		return Response(data)
	

class CreditViewSet(CommonViewset, generics.RetrieveAPIView):
	queryset = AbCredits.objects.all()
	serializer_class = AbCreditsSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	filter_fields = ('id',)

	def list(self, request, *args, **kwargs):
		queryset = self.filter_queryset(self.get_queryset())
		page = self.paginate_queryset(queryset)
		if page is not None:
			serializer = self.get_serializer(page, many=True)
			return self.get_paginated_response(serializer.data)
		serializer = self.get_serializer(queryset, many=True)
		return Response(serializer.data)

	def perform_create(self, serializer):
		return serializer.save()

	def retrieve(self, request: Request, *args, **kwargs):
		instance = self.get_object()
		serializer = self.get_serializer(instance)
		data = serializer.data
		return Response(data)


class AbGlobalViewSet(CommonViewset, generics.RetrieveAPIView):
	queryset = AbGlobal.objects.all()
	serializer_class = AbGlobalSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	filter_fields = ('title',)
	search_fields = ('title',)
	permission_classes = [IsAuthenticatedOrReadOnly]

	def list(self, request, *args, **kwargs):
		queryset = self.filter_queryset(self.get_queryset())
		filters = request.GET.get('filters', None)
		if filters is not None:
			q_objects = Q()
			############## aicraft filter section start ##############
			aircraftQueryset = None

			filters = json.loads(filters)
			related_model_fields = ['configuration','category','type','model','manufacturer']

			fields = {
				'offer_for':'offer_for', 
				'aircraft_status':'status',
			}
			for label, field in fields.items():
				if label in filters and filters[label]:
					if aircraftQueryset is None:
						aircraftQueryset = AbAircrafts.objects.filter(**{'{}__in'.format(field): filters[label]})
					else:
						aircraftQueryset = aircraftQueryset.filter(**{'{}__in'.format(field): filters[label]})


			for field in related_model_fields:
				if field in filters and filters[field]:
					if aircraftQueryset is None:
						aircraftQueryset = AbAircrafts.objects.filter(**{'{}_id__in'.format(field): filters[field]})
					else:
						aircraftQueryset = aircraftQueryset.filter(**{'{}_id__in'.format(field): filters[field]})
			
			if 'yom_start' in filters:
				if aircraftQueryset is None:
					aircraftQueryset = AbAircrafts.objects.filter(Q(yom__gte = filters['yom_start']))
				else:
					aircraftQueryset = aircraftQueryset.filter(Q(yom__gte = filters['yom_start']))	

			if 'yom_end' in filters:
				if aircraftQueryset is None:
					aircraftQueryset = AbAircrafts.objects.filter(Q(yom__lte = filters['yom_end']))
				else:
					aircraftQueryset = aircraftQueryset.filter(Q(yom__lte = filters['yom_end']))

			if 'yom_start' and 'yom_end' in filters:
				if aircraftQueryset is None:
					aircraftQueryset = AbAircrafts.objects.filter(Q(yom__gte = filters['yom_start']) & Q(yom__lte = filters['yom_end']))
				else:
					aircraftQueryset = aircraftQueryset.filter(Q(yom__gte = filters['yom_start']) & Q(yom__lte = filters['yom_end']))

			if aircraftQueryset is not None:
				q_objects |= Q(model='Aircraft', model_id__in=aircraftQueryset.values_list('id', flat=True))

			
			############### engine filter section start ##################

			engineQueryset = None
			related_model_fields = ['category','type','model','manufacturer']

			fields = {
				'offer_for':'offer_for', 
			}
			for label, field in fields.items():
				if label in filters and filters[label]:
					if engineQueryset is None:
						engineQueryset = AbEngines.objects.filter(**{'{}__in'.format(field): filters[label]})
					else:
						engineQueryset = engineQueryset.filter(**{'{}__in'.format(field): filters[label]})


			for field in related_model_fields:
				if field in filters and filters[field]:
					if engineQueryset is None:
						engineQueryset = AbEngines.objects.filter(**{'{}_id__in'.format(field): filters[field]})
					else:
						engineQueryset = engineQueryset.filter(**{'{}_id__in'.format(field): filters[field]})

			# code for remaining cycle filter
			if 'engine_cycles_start' in filters:
				if engineQueryset is None:
					engineQueryset = AbEngines.objects.filter(Q(cycle_remaining__gte = filters['engine_cycles_start']))
				else:	
					engineQueryset = engineQueryset.filter(Q(cycle_remaining__gte = filters['engine_cycles_start']))

			if 'engine_cycles_end' in filters:
				if engineQueryset is None:
					engineQueryset = AbEngines.objects.filter(Q(cycle_remaining__lte = filters['engine_cycles_end']))
				else:	
					engineQueryset = engineQueryset.filter(Q(cycle_remaining__lte = filters['engine_cycles_end']))

			if 'engine_cycles_start' and 'engine_cycles_end' in filters:
				if engineQueryset is None:
					engineQueryset = AbEngines.objects.filter(Q(cycle_remaining__gte = filters['engine_cycles_start']) & Q(cycle_remaining__lte = filters['engine_cycles_end']))
				else:
					engineQueryset = engineQueryset.filter(Q(cycle_remaining__gte = filters['engine_cycles_start']) & Q(cycle_remaining__lte = filters['engine_cycles_end']))


			if engineQueryset is not None:
				q_objects |= Q(model='Engine', model_id__in=engineQueryset.values_list('id', flat=True))

			
			############### apu filter section start ##################

			apuQueryset = None

			related_model_fields = ['category','type','model','manufacturer']

			fields = {
				'offer_for':'offer_for', 
			}

			for label, field in fields.items():
				if label in filters and filters[label]:
					if apuQueryset is None:
						apuQueryset = AbApus.objects.filter(**{'{}__in'.format(field): filters[label]})
					else:
						apuQueryset = apuQueryset.filter(**{'{}__in'.format(field): filters[label]})


			for field in related_model_fields:
				if field in filters and filters[field]:
					if apuQueryset is None:
						apuQueryset = AbApus.objects.filter(**{'{}_id__in'.format(field): filters[field]})
					else:
						apuQueryset = apuQueryset.filter(**{'{}_id__in'.format(field): filters[field]})

					# code for remaining cycle filter
			if 'apu_cycles_start' in filters:
				if apuQueryset is None:
					apuQueryset = AbApus.objects.filter(Q(cycle_remaining__gte = filters['apu_cycles_start']))
				else:
					apuQueryset = apuQueryset.filter(Q(cycle_remaining__gte = filters['apu_cycles_start']))

			if 'apu_cycles_end' in filters:
				if apuQueryset is None:
					apuQueryset = AbApus.objects.filter(Q(cycle_remaining__lte = filters['apu_cycles_end']))
				else:
					apuQueryset = apuQueryset.filter(Q(cycle_remaining__lte = filters['apu_cycles_end']))

			if 'apu_cycles_start' and 'apu_cycles_end' in filters:
				if apuQueryset is None:
					apuQueryset = AbApus.objects.filter(Q(cycle_remaining__gte = filters['apu_cycles_start']) & Q(cycle_remaining__lte = filters['apu_cycles_end']))
				else:
					apuQueryset = apuQueryset.filter(Q(cycle_remaining__gte = filters['apu_cycles_start']) & Q(cycle_remaining__lte = filters['apu_cycles_end']))


			if apuQueryset is not None:
				q_objects |= Q(model='Apu', model_id__in=apuQueryset.values_list('id', flat=True))

			
			############### wanted filter section start ##################

			wantedQueryset = None

			related_model_fields = ['country']

			fields = {
				'terms':'terms',
				'type':'type',

			}
			for label, field in fields.items():
				if label in filters and filters[label]:
					if wantedQueryset is None:
						wantedQueryset = AbWanteds.objects.filter(**{'{}__in'.format(field): filters[label]})
					else:
						wantedQueryset = wantedQueryset.filter(**{'{}__in'.format(field): filters[label]})


			for field in related_model_fields:
				if field in filters and filters[field]:
					if wantedQueryset is None:
						wantedQueryset = AbWanteds.objects.filter(**{'{}__in'.format(field): filters[label]})
					else:
						wantedQueryset = wantedQueryset.filter(**{'{}_id__in'.format(field): filters[field]})
	

			if wantedQueryset is not None:
				q_objects |= Q(model='Wanted', model_id__in=wantedQueryset.values_list('id', flat=True))


			############### airport filter section start ##################

			airportQueryset = None

			related_model_fields = ['country','airfield_type']

			for field in related_model_fields:
				if field in filters and filters[field]:
					if wantedQueryset is None:
						airportQueryset = AbAirports.objects.filter(**{'{}_id__in'.format(field): filters[field]})
					else:
						airportQueryset = airportQueryset.filter(**{'{}_id__in'.format(field): filters[field]})


			if airportQueryset is not None:
				q_objects |= Q(model='Airport', model_id__in=airportQueryset.values_list('id', flat=True))


			############### company filter section start ##################

			companyQueryset = None

			related_model_fields = ['country',]

			for field in related_model_fields:
				if field in filters and filters[field]:
					if companyQueryset is None:
						companyQueryset = AbCompanies.objects.filter(**{'{}_id__in'.format(field): filters[field]})
					else:
						companyQueryset = companyQueryset.filter(**{'{}_id__in'.format(field): filters[field]})

			# code for specialty
			if filters is not None and 'specialty' in filters:
				if companyQueryset is None:
					companyQueryset = AbCompanies.objects.filter(specialities__id__in=filters['specialty'])
				else:
					companyQueryset = companyQueryset.filter(specialities__id__in=filters['specialty'])
	

			if companyQueryset is not None:
				q_objects |= Q(model='Company', model_id__in=companyQueryset.values_list('id', flat=True))


			############### contact filter section start ##################

			contactQueryset = None

			related_model_fields = ['company','country']

			fields = {
				'job_title':'job_title',
			}
			for label, field in fields.items():
				if label in filters and filters[label]:
					if contactQueryset is None:
						contactQueryset = AbContacts.objects.filter(**{'{}__in'.format(field): filters[label]})
					else:
						contactQueryset = contactQueryset.filter(**{'{}__in'.format(field): filters[label]})


			for field in related_model_fields:
				if field in filters and filters[field]:
					if contactQueryset is None:
						contactQueryset = AbContacts.objects.filter(**{'{}_id__in'.format(field): filters[field]})
					else:
						contactQueryset = contactQueryset.filter(**{'{}_id__in'.format(field): filters[field]})
	

			if contactQueryset is not None:
				q_objects |= Q(model='Contact', model_id__in=contactQueryset.values_list('id', flat=True))


			queryset = queryset.filter(q_objects)

		counts = {
			'AbAircrafts' : queryset.filter(model='AbAircrafts').count(),
			'AbEngines' : queryset.filter(model='AbEngines').count(),
			'AbApus' : queryset.filter(model='AbApus').count(),
			'AbWanteds' : queryset.filter(model='AbWanteds').count(),
			'AbContacts' : queryset.filter(model='AbContacts').count(),
			'AbCompanies' : queryset.filter(model='AbCompanies').count(),
			'AbAirports' : queryset.filter(model='AbAirports').count(),
		}

		page = self.paginate_queryset(queryset)
		if page is not None:
			data = self.get_serializer(page, many=True).data
			return self.get_paginated_response({'counts':counts, 'data':data})
		data = self.get_serializer(queryset, many=True).data
		return Response({'counts':counts, 'data':data})


class ViewsViewSet(viewsets.ModelViewSet, generics.RetrieveAPIView):

	queryset = AbViews.objects.filter(deleted_at=None)
	serializer_class = ViewsSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	filter_fields = ('id','viewable_id','viewable_type')

	def get_permissions(self):
		if self.action == 'create':
			return [AllowAny(), ]        
		return super(ViewsViewSet, self).get_permissions()

	def perform_create(self, serializer):
		return serializer.save()

	def destroy(self, request, *args, **kwargs):
		resp = safe_delete(self, request, AbViewss)
		return resp

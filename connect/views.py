from connect.models import *
from info.models import *
from connect.serializers import *
from item.serializers import AircraftsSerializer, EnginesSerializer, ApusSerializer, WantedsSerializer
from rest_framework import viewsets, filters, generics
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.request import Request
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from datetime import datetime
from django.template import Template, Context
from connect.models import AbSpecialities, AbDepartments, AbCountries, AbCities, AbStates
from info.models import AbMedias, AbNews
from account.models import AbUsers
from rest_framework.status import (
	HTTP_400_BAD_REQUEST,
	HTTP_404_NOT_FOUND,
	HTTP_200_OK,
	HTTP_204_NO_CONTENT)

from django.http import JsonResponse
from default.views import CommonViewset
import json
from default.views import *
from default.services import to_dict, send_emails
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from django.conf import settings
from django.template.loader import get_template
from django.utils.safestring import mark_safe
from django.db.models import Q

class ContinentsViewSet(CommonViewset, generics.RetrieveAPIView):

	queryset = AbContinents.objects.filter(deleted_at=None)
	serializer_class = ContinentsSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	ordering_fields = ('id', 'name',)
	filter_fields = ('id', 'is_active',)
	search_fields = ('id', 'name',)


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
		resp = safe_delete(self, request, AbContinents)
		return resp


class RegionsViewSet(CommonViewset, generics.RetrieveAPIView):

	queryset = AbRegions.objects.filter(deleted_at=None)
	serializer_class = RegionsSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	ordering_fields = ('id', 'name',)
	filter_fields = ('id', 'is_active','continent_id')
	search_fields = ('id', 'name',)


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
		try:
			data['continent'] = to_dict(instance.continent)
		except:
			data['continent'] = None
		return Response(data)

	def destroy(self, request, *args, **kwargs):
		resp = safe_delete(self, request, AbRegions)
		return resp


class CountryViewSet(CommonViewset, generics.RetrieveAPIView):

	queryset = AbCountries.objects.filter(deleted_at=None)
	serializer_class = CountrySerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	ordering_fields = ('id', 'name','continent__name','region__name')
	filter_fields = ('id','is_active','region_id')
	search_fields = ('id', 'name','continent__name','region__name')


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
		data['media'] = AbMedias.get_media(instance, 'App\\Country')
		return Response(data)

	def destroy(self, request, *args, **kwargs):
		resp = safe_delete(self, request, AbCountries)
		return resp


class StatesViewSet(CommonViewset, generics.RetrieveAPIView):

	queryset = AbStates.objects.filter(deleted_at=None)
	serializer_class = StatesSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	ordering_fields = ('id', 'name',)
	filter_fields = ('id','is_active','country_id')
	search_fields = ('id', 'name','country__name')

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
		resp = safe_delete(self, request, AbStates)
		return resp


class CityViewSet(CommonViewset, generics.RetrieveAPIView):

	queryset = AbCities.objects.filter(deleted_at=None)
	serializer_class = CitySerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	ordering_fields =  ('id', 'name','state__name',)
	filter_fields = ('id', 'is_active','state_id')
	search_fields = ('id', 'name','state__name',)

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
		resp = safe_delete(self, request, AbCities)
		return resp



class CompanyViewSet(CommonViewset, generics.RetrieveAPIView):
	
	"""
	This viewset automatically provides `list` and `detail` actions.
	"""

	queryset = AbCompanies.objects.filter(deleted_at=None)
	serializer_class = CompanySerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	ordering_fields = ('id', 'name','specialities__name',)
	filter_fields = ('id', 'is_active','specialities')
	search_fields = ('id', 'name','specialities__name',)
	permission_classes = [IsAuthenticatedOrReadOnly]

	def get_permissions(self):
		if self.action == 'create':
			return [AllowAny(), ]        
		return super(CompanyViewSet, self).get_permissions()

	def get_authenticators(self):
		authenticators = super().get_authenticators()
		method = self.request.method.lower()
		if method == 'post':
			return [CustomTokenAuthentication()]
		else:
			return authenticators

	def list(self, request, *args, **kwargs):
		records = request.GET.get('records', None)

		# check call from frontend
		frontend = request.GET.get('frontend', False)
		if frontend:
			filters = request.GET.get('filters', None)
			if filters is not None:
				filters = json.loads(filters)
				related_model_fields = ['country',]

				for field in related_model_fields:
					if field in filters and filters[field]:
						self.queryset = self.queryset.filter(**{'{}_id__in'.format(field): filters[field]})

			# code for specialty
			if filters is not None and 'specialty' in filters:
				self.queryset = self.queryset.filter(specialities__id__in=filters['specialty'])

			search = request.GET.get('search', None)
			if search is not None:
				self.queryset = self.queryset.filter(name__icontains=search)

			self.queryset = self.queryset.filter(is_active=1).order_by('order_no')			


		available = request.GET.get('available', False)
		contact_id = request.GET.get('contact_id', None)
		queryset = self.filter_queryset(self.get_queryset())
		if available:
			contacts = AbContacts.objects.filter(company_id__isnull=False)
			if contact_id is not None:
				contacts = contacts.exclude(id=contact_id)

			queryset = queryset.exclude(id__in=contacts.values_list('company_id', flat=True))
		
		page = self.paginate_queryset(queryset)
		if page is not None and records is None:
			serializer = self.get_serializer(page,many=True)
			return self.get_paginated_response(serializer.data)
			
		serializer = self.get_serializer(self.queryset,many=True,)
		return Response(serializer.data)

	def retrieve(self, request: Request, *args, **kwargs):
		instance = self.get_object()
		query_params = self.request.query_params
		frontend = query_params.get('frontend', None)
		if (instance.is_active == 1) or (frontend is None and request.user.is_authenticated and (not isRoleUser(request.user) or request.user == instance.user)) :
			serializer = self.get_serializer(instance)
			data = serializer.data
			data['media'] = AbMedias.get_media(instance, 'App\\Company')

			related_models = ['country','city','state']
			
			for model in related_models:
				try:
					data[model] = to_dict(getattr(instance, model))                                                    
				except:
					data[model] = None

			assets = ['AbAircrafts', 'AbEngines', 'AbApus', 'AbWanteds']
			
			for i,v in enumerate(assets):
				if 'AbWanteds' == assets[i]:
					if globals()[v].objects.filter(is_published=1, is_active=1, deleted_at=None, user__contact__company=instance).exists():
						data[assets[i]] = globals()[assets[i]].objects.filter(is_published=1,is_active=1, deleted_at=None, user__contact__company=instance).order_by('?').values()[0]
						
					else:
						data[assets[i]] = {}
				else:
					if globals()[v].objects.filter(isactivestatus="approved", is_active_by_user=1, deleted_at=None, user__contact__company=instance).exists():
						data[assets[i]] = globals()[assets[i]].objects.filter(isactivestatus= "approved", is_active_by_user=1, deleted_at= None, user__contact__company=instance).order_by('?').values()[0]
					else:
						data[assets[i]] = {}
		else :
			data = []			
				
		return Response(data)

	def destroy(self, request, *args, **kwargs):
		resp = safe_delete(self, request, AbCompanies)
		return resp

	@action(detail=False, methods=['GET'], name='related_companies')
	def related_companies(self, request, *args, **kwargs):
		related_companies = AbCompanies.objects.filter(city=kwargs['city'], deleted_at=None, is_active=1).exclude(id=kwargs['pk'])[0:4]
		relatedCount = related_companies.count()
		if relatedCount < 4:
			other_related = AbCompanies.objects.filter(deleted_at=None, is_active=1).exclude(id=kwargs['pk'])
			for company in related_companies:
				other_related = other_related.exclude(id=company.id)
			other_related	= other_related[0:4-relatedCount]

			related_companies = related_companies.union(other_related)
		serializer = self.get_serializer(related_companies, many=True)
		return Response(serializer.data, status=HTTP_200_OK)	

class ContactViewSet(CommonViewset, generics.RetrieveAPIView):
	"""
	This viewset automatically provides `list` and `detail` actions.
	"""
	queryset = AbContacts.objects.filter(deleted_at=None)
	serializer_class = ContactSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	ordering_fields = ('id','name','job_title__name',)
	filter_fields = ('id','company_id')
	search_fields = ('id','name','job_title__name','first_name','last_name')
	permission_classes = [IsAuthenticatedOrReadOnly]

	def list(self, request, *args, **kwargs):
		records = request.GET.get('records', None)

		# check call from frontend
		frontend = request.GET.get('frontend', False)
		if frontend:
			filters = request.GET.get('filters', None)
			if filters is not None:
				filters = json.loads(filters)
				related_model_fields = ['company','country', 'department']

				fields = {
					'job_title':'job_title',
				}
				for label, field in fields.items():
					if label in filters and filters[label]:
						self.queryset = self.queryset.filter(**{'{}__in'.format(field): filters[label]})


				for field in related_model_fields:
					if field in filters and filters[field]:
						self.queryset = self.queryset.filter(**{'{}_id__in'.format(field): filters[field]})
			search = request.GET.get('search', None)
			if search is not None:
				search = search.split(' ')
				if len(search) > 1:
					self.queryset = self.queryset.filter(Q(first_name__icontains=search[0]) | Q(last_name__icontains=search[1]))
				else:
					self.queryset = self.queryset.filter(first_name__icontains=search[0])

			self.queryset = self.queryset.filter(is_published=1).order_by('order_no')			
		else:
			if isRoleUser(request.user):
				self.queryset = self.queryset.filter(creator=request.user).exclude(user=request.user)
			self.queryset = self.filter_queryset(self.queryset)

		self.queryset = self.get_queryset()
		page = self.paginate_queryset(self.queryset)
		if page is not None and records is None:
			serializer = self.get_serializer(page, many=True)
			return self.get_paginated_response(serializer.data)
		serializer = self.get_serializer(self.queryset, many=True)
		return Response(serializer.data)

	def retrieve(self, request: Request, *args, **kwargs):
		instance = self.get_object()
		query_params = self.request.query_params
		frontend = query_params.get('frontend', None)
		if (instance.is_published == 1) or (frontend is None and request.user.is_authenticated and (not isRoleUser(request.user) or request.user == instance.user))  :
			serializer = self.get_serializer(instance)
			data = serializer.data
			# serializer['companies'] = AbCompanies.available_companies(instance)
			data['media'] = AbMedias.get_media(instance, 'App\\Contact')
			try:
				data['user'] = to_dict(instance.user)
				try:
					data['user']['contact'] = to_dict(instance.user.contact)
				except:
					data['user']['contact'] = None
			except:
				data['user'] = None

			related_models = ['department','country','city','state','company']
			
			for model in related_models:
				try:
					data[model] = to_dict(getattr(instance, model))
				except:
					data[model] = None
		else :
			data = []			

		return Response(data)

	def destroy(self, request, *args, **kwargs):
		resp = safe_delete(self, request, AbContacts)
		return resp

	@action(detail=False, methods=['GET'], name='related_contacts')
	def related_contacts(self, request, *args, **kwargs):
		related_contacts = AbContacts.objects.filter(company=kwargs['company'], deleted_at=None, is_published=1).exclude(id=kwargs['pk'])[0:4]
		relatedCount = related_contacts.count()
		if relatedCount < 4:
			other_related = AbContacts.objects.filter(deleted_at=None, is_published=1).exclude(id=kwargs['pk'])
			for contact in related_contacts:
				other_related = other_related.exclude(id=contact.id)
			other_related	= other_related[0:4-relatedCount]

			related_contacts = related_contacts.union(other_related)
		serializer = self.get_serializer(related_contacts, many=True)
		return Response(serializer.data, status=HTTP_200_OK)	

	@action(detail=False, methods=['GET'], name='aircraft_by_user')
	def aircraft_by_user(self, request, *args, **kwargs):
		contact = AbContacts.objects.get(id=kwargs['pk'])
		#print("contact====",contact.id)
		length = request.GET.get('length') 
		user_aircraft = AbAircrafts.objects.filter(Q(user=contact.user) | Q(primary_contact=contact.id), deleted_at=None, is_active_by_user=1, isactivestatus='approved')[0:int(length)]
		serializer = AircraftsSerializer(user_aircraft, many=True)
		return Response(serializer.data, status=HTTP_200_OK)

	@action(detail=False, methods=['GET'], name='engine_by_user')
	def engine_by_user(self, request, *args, **kwargs):
		contact = AbContacts.objects.get(id=kwargs['pk'])
		length = request.GET.get('length') 
		user_engine = AbEngines.objects.filter(Q(user=contact.user) | Q(primary_contact=contact.id), deleted_at=None, is_active_by_user=1, isactivestatus='approved')[0:int(length)]
		serializer = EnginesSerializer(user_engine, many=True)
		print("contact>>>>", serializer)
		return Response(serializer.data, status=HTTP_200_OK)

	@action(detail=False, methods=['GET'], name='apu_by_user')
	def apu_by_user(self, request, *args, **kwargs):
		contact = AbContacts.objects.get(id=kwargs['pk'])
		length = request.GET.get('length') 
		user_apu = AbApus.objects.filter(Q(user=contact.user) | Q(primary_contact=contact.id), deleted_at=None, is_active_by_user=1, isactivestatus='approved')[0:int(length)]
		serializer = ApusSerializer(user_apu, many=True)
		return Response(serializer.data, status=HTTP_200_OK)

	@action(detail=False, methods=['GET'], name='wanted_by_user')
	def wanted_by_user(self, request, *args, **kwargs):
		contact = AbContacts.objects.get(id=kwargs['pk'])
		length = request.GET.get('length') 
		user_wanted = AbWanteds.objects.filter(Q(user=contact.user) | Q(primary_contact=contact.id), deleted_at=None, is_published=1,is_active=1)[0:int(length)]
		serializer = WantedsSerializer(user_wanted, many=True)
		return Response(serializer.data, status=HTTP_200_OK)

class ContactqueriesViewSet(CommonViewset, generics.RetrieveAPIView):
	queryset = AbContactQueries.objects.filter(deleted_at=None)
	serializer_class = ContactqueriesSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	ordering_fields = ('id','name','email','country__name')
	filter_fields = ('id','is_active',)
	search_fields = ('id','name','email','country__name')
	permission_classes = [IsAuthenticatedOrReadOnly]

	def get_permissions(self):
		if self.action == 'create':
			return [AllowAny(), ]        
		return super(ContactqueriesViewSet, self).get_permissions()

	def get_authenticators(self):
		authenticators = super().get_authenticators()
		method = self.request.method.lower()
		if method == 'post':
			return [CustomTokenAuthentication()]
		else:
			return authenticators
		
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
		resp = safe_delete(self, request, AbContactQueries)
		return resp

# def contact_details(self):
# 	return JsonResponse({
# 		'companies': AbCompanies.objects.filter(deleted_at=None),
# 		'departments': AbCompanies.objects.filter(deleted_at=None),
# 		'countries': AbCompanies.objects.filter(deleted_at=None),
# 		'states': AbCompanies.objects.filter(deleted_at=None),
# 		'cities': AbCompanies.objects.filter(deleted_at=None),
# 		'titles': AbCompanies.objects.filter(deleted_at=None),
# 		'religion': AbCompanies.objects.filter(deleted_at=None),
# 		})

class SpecialityViewSet(CommonViewset, generics.RetrieveAPIView):

	queryset = AbSpecialities.objects.filter(deleted_at=None)
	serializer_class = SpecialitySerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	ordering_fields = ('id', 'name',)
	filter_fields = ('id', 'is_active',)
	search_fields = ('id', 'name',)

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
		resp = safe_delete(self, request, AbSpecialities)
		return resp


class DepartmentViewSet(CommonViewset, generics.RetrieveAPIView):

	queryset = AbDepartments.objects.filter(deleted_at=None)
	serializer_class = DepartmentSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	ordering_fields = ('id', 'name',)
	filter_fields = ('id', 'is_active',)
	search_fields = ('id', 'name',)

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
		resp = safe_delete(self, request, AbDepartments)
		return resp


class SpecialityViewSet(CommonViewset, generics.RetrieveAPIView):

	queryset = AbSpecialities.objects.filter(deleted_at=None)
	serializer_class = SpecialitySerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	ordering_fields = ('id', 'name',)
	filter_fields = ('id', 'is_active',)
	search_fields = ('id', 'name',)

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
		resp = safe_delete(self, request, AbSpecialities)
		return resp


class LeadsViewSet(viewsets.ModelViewSet, generics.RetrieveAPIView):

	queryset = AbLeads.objects.filter(deleted_at=None)
	serializer_class = LeadsSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	ordering_fields = ('id',)
	filter_fields = ('id','is_active', 'creator__contact__first_name', 'creator__contact__last_name', 'creator__contact__company__name' )
	search_fields = ('id',)

	def list(self, request, *args, **kwargs):
		records = request.GET.get('records', None)

		search_str = request.GET.get('search[value]', None)
		if (request.query_params.get('layout') == 'dashboard'):
			if isRoleUser(request.user):
				self.queryset = self.queryset.filter(user=request.user)[:4]
			else:
				self.queryset = self.queryset.filter()[:5]
		else:
			if search_str is not None and search_str != '':
				self.queryset = self.queryset.filter(Q(
					leadable_type='App\\Aircraft', leadable_id__in = AbAircrafts.objects.filter(title__icontains=search_str).values_list('id', flat = True)) | Q(
					leadable_type='App\\Apu', leadable_id__in = AbApus.objects.filter(title__icontains=search_str).values_list('id', flat = True)) | Q(
					leadable_type='App\\Engine', leadable_id__in = AbEngines.objects.filter(title__icontains=search_str).values_list('id', flat = True)) | Q(
					leadable_type='App\\Contact', leadable_id__in = AbContacts.objects.filter(Q(first_name__icontains=search_str) | Q(last_name__icontains=search_str)).values_list('id', flat = True)) | Q(
					leadable_type='App\\Wanted', leadable_id__in = AbWanteds.objects.filter(title__icontains=search_str).values_list('id', flat = True)) | Q(
					creator__contact__first_name__icontains=search_str ) | Q(
					creator__contact__last_name__icontains=search_str) | Q(
					creator__contact__company__name__icontains=search_str))

			if isRoleUser(request.user):
				self.queryset = self.queryset.filter(user=request.user)
			self.queryset = self.filter_queryset(self.queryset)

		self.queryset = self.get_queryset()
		page = self.paginate_queryset(self.queryset)
		if page is not None and records is None:
			serializer = self.get_serializer(page, many=True)
			return self.get_paginated_response(serializer.data)
		serializer = self.get_serializer(self.queryset, many=True)
		return Response(serializer.data)

	def perform_create(self, serializer):
		return serializer.save()

	def retrieve(self, request: Request, *args, **kwargs):
		instance = self.get_object()
		serializer = self.get_serializer(instance)
		return Response(serializer.data)

	def destroy(self, request, *args, **kwargs):
		resp = safe_delete(self, request, AbLeads)
		return resp


class LikeViewSet(viewsets.ModelViewSet, generics.RetrieveAPIView):

	queryset = AbLikes.objects.filter(deleted_at=None)
	serializer_class = LikesSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	ordering_fields = ('id','likeable__job_title__name',)
	filter_fields = ('id','likeable__job_title__name',)
	search_fields = ('id',)

	def list(self, request, *args, **kwargs):
		queryset = self.filter_queryset(self.get_queryset())
		records = request.GET.get('records', None)

		search_str = request.GET.get('search[value]', None)
		if search_str is not None:
				queryset = queryset.filter(Q(
					likable_type='App\\Contact', likable_id__in = AbContacts.objects.filter(Q(first_name__icontains=search_str) | Q(last_name__icontains=search_str)).values_list('id', flat = True)))

		type = request.GET.get('type', None)

		if isRoleUser(request.user):
			queryset = queryset.filter(user=request.user)

		if type == 'connections':
			queryset = queryset.filter(likable_type='App\\Contact')

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
		resp = safe_delete(self, request, AbLikes)
		return resp


class FavouriteViewSet(viewsets.ModelViewSet, generics.RetrieveAPIView):

	queryset = AbFavourites.objects.filter(deleted_at=None)
	serializer_class = FavouritesSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	ordering_fields = ('id',)
	filter_fields = ('id',)
	search_fields = ('id',)

	def list(self, request, *args, **kwargs):
		queryset = self.filter_queryset(self.get_queryset())
		records = request.GET.get('records', None)
		type = request.GET.get('type', None)

		search_str = request.GET.get('search[value]', None)
		if search_str is not None:
				queryset = queryset.filter(Q(
					favouritable_type='App\\Aircraft',   favouritable_id__in = AbAircrafts.objects.filter(title__icontains=search_str).values_list('id', flat = True)) | Q(
					favouritable_type='App\\Apu', 		favouritable_id__in = AbApus.objects.filter(title__icontains=search_str).values_list('id', flat = True)) | Q(
					favouritable_type='App\\Engine',     favouritable_id__in = AbEngines.objects.filter(title__icontains=search_str).values_list('id', flat = True)) | Q(
					favouritable_type='App\\Contact',    favouritable_id__in = AbContacts.objects.filter(Q(first_name__icontains=search_str) | Q(last_name__icontains=search_str)).values_list('id', flat = True)) | Q(
					favouritable_type='App\\Company',    favouritable_id__in = AbCompanies.objects.filter(name__icontains=search_str).values_list('id', flat = True)) | Q(
					favouritable_type='App\\News',       favouritable_id__in = AbNews.objects.filter(title__icontains=search_str).values_list('id', flat = True)) | Q(
					favouritable_type='App\\Wanted',     favouritable_id__in = AbWanteds.objects.filter(title__icontains=search_str).values_list('id', flat = True)))
					
		if isRoleUser(request.user):
			queryset = queryset.filter(user=request.user)

		if type == '!events':
			queryset = queryset.exclude(favouritable_type='App\\Event')

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
		resp = safe_delete(self, request, AbFavourites)
		return resp


class ConnectionViewSet(viewsets.ModelViewSet):
	queryset = AbConnections.objects.filter(deleted_at=None)
	serializer_class = ConnectionsSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	ordering_fields = ('id',)
	filter_fields = ('id',)
	search_fields = ('id',)

	def list(self, request, *args, **kwargs):
		queryset = self.filter_queryset(self.get_queryset())
		records = request.GET.get('records', None)
		if isRoleUser(request.user):
			queryset = AbConnections.objects.filter(deleted_at=None).filter(user=request.user)
			
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
		resp = safe_delete(self, request, AbConnections)
		return resp


def safe_delete(self, request, ModelName, field='id'):
	instance = self.get_object()
	from datetime import datetime
	request_data = json.loads(request.body.decode('utf-8'))
	lookup = "{}__in".format(field)
	if 'ids' in request_data:
		ModelName.objects.filter(**{lookup : request_data['ids']}).update(
			deleted_at=datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
		return Response(status=HTTP_204_NO_CONTENT)
	else:
		instance.deleted_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
		instance.save()
		return Response(status=HTTP_204_NO_CONTENT)

@api_view(["POST"])
def send_message(request):
	model = request.data.get('model')
	message = request.data.get('message')
	year = datetime.now().year
	model_id = request.data.get('model_id')

	allowed_models = [
		'Aircraft','Engine','Apu','Part','Wanted','Contact','Company']

	queryset = None
	# check if model is allowed
	if model in allowed_models:
		django_model = 'Ab{}s'.format(model)
		frontend_route = model.lower()

		if model == 'Part':
			frontend_route += 's'

		elif model == 'Company':
			django_model = 'AbCompanies'

		model_db = globals()[django_model] # make model object
		model_obj = model_db.objects.get(id=model_id)
		if model == 'Contact':
			model_id = model_obj.creator.id
		ableads = AbLeads(is_active=1, leadable_type='App\\{}'.format(model), leadable_id=model_id, creator=request.user,message=message,lead_status='Unread')
		if model != 'Company':
			ableads.user = model_obj.user
		# 	TODO: change the user & lead issue
		elif model == "Company":
			ableads.user = request.user
		ableads.save()
		if model != 'Company':

			if model == 'Contact':
				frontend_route += '/{}-{}-{}'.format(model_obj.id, model_obj.first_name, model_obj.last_name)
			elif model == 'Company':
				frontend_route += '/{}-{}'.format(model_obj.id, model_obj.name)
			else:
				frontend_route += '/{}-{}'.format(model_obj.id, model_obj.title)

			user = model_obj.user
			try:
				contact = user.contact.first()
				if contact.first_name is not None:
					user_name = '{} {}'.format(contact.first_name, contact.last_name)
				else:
					user_name = 'User'
			except:
				user_name = 'User'

			try:
				sender = request.user.contact.first()

				sender = {
					'name':'{} {}'.format(sender.first_name, sender.last_name) if sender.first_name is not None else '',
					'email': request.user.email
				}
			except:
				sender = {
					'name':'',
					'email': request.user.email
				}

			context = {
				'user': user_name,
				'sender':sender,
				'message': message,
				'link': '{}/{}'.format(settings.SITE_URL, frontend_route),
				'leads_link':'{}/user/lead'.format(settings.SITE_URL)
			}

			message_content = get_template('email/user/send_message.html').render(context)
			email_template = AbCannedemails.objects.get(message_type='leads-email')
			footer_message = Template(mark_safe(email_template.footer_message)).render(
				Context({'asset': email_template.footer_message}))
			context = {'email_content': mark_safe(message_content), 'footer_message':footer_message, 'year': year}

			subject = email_template.subject
			html_content = get_template('email/canned/general.html').render(context)

			send_emails(subject, html_content, [user.email], rep_to=[request.user.email])

			# email to current login user
			subject = 'Copy - ' + subject
			send_emails(subject, html_content, [request.user.email])

	return Response({"status":"Message send Successfull"},status=HTTP_200_OK)
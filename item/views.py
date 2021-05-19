from django.shortcuts import render
from item.models import *
from item.serializers import *
from rest_framework import viewsets,filters, generics
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.request import Request
from django.views.decorators.csrf import csrf_exempt
from django.template.loader import get_template
from django.template import Template, Context
from django.http import HttpResponseRedirect ,JsonResponse 
from rest_framework.response import Response
from rest_framework.status import (
	HTTP_400_BAD_REQUEST,
	HTTP_404_NOT_FOUND,
	HTTP_200_OK,
	HTTP_204_NO_CONTENT
)
import json
from connect.views import safe_delete
from default.views import CommonViewset, isRoleUser
from datetime import datetime, timezone, timedelta, date
from info.models import AbPaymentHistories, AbCannedemails, AbPlans, AbCredits, AbCategories, AbConfigurations, AbPricing
from account.models import AbUsers, AbTypes
from connect.models import AbContacts, AbCountries
from default.services import createPayTabPage, to_dict, getPlanNameAndType,send_emails, like_and_favourite_by_id, like_and_favourite_by_type
from django.utils.safestring import mark_safe
from rest_framework.decorators import api_view, action, authentication_classes, permission_classes
from django.conf import settings
from django.forms.models import model_to_dict
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.authentication import TokenAuthentication
from django.db.models import Q
from calendar import monthrange
from dateutil.relativedelta import relativedelta
from rest_framework.permissions import AllowAny
from random import randrange

class ConditionViewSet(CommonViewset, generics.RetrieveAPIView):

	queryset = AbConditions.objects.filter(deleted_at=None)
	serializer_class = ConditionsSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,DjangoFilterBackend,)
	ordering_fields = ('id','name')
	filter_fields = ('id','is_active')
	search_fields = ('id','name')

	def list(self, request, *args, **kwargs):
		queryset = self.filter_queryset(self.get_queryset())
		records = request.GET.get('records', None)
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
		resp = safe_delete(self, request, AbConditions)
		return resp


class AircraftViewSet(CommonViewset, generics.RetrieveAPIView):

	queryset = AbAircrafts.objects.filter(deleted_at=None)
	serializer_class = AircraftsSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	ordering_fields = ('id','title','msn')
	filter_fields = ('id','isactivestatus', 'type', 'model','user')
	search_fields = ('id','title','msn')
	permission_classes = [IsAuthenticatedOrReadOnly]

	def list(self, request, *args, **kwargs):
		records = request.GET.get('records', None)
		# check call from frontend
		frontend = request.GET.get('frontend', False)
		if frontend:
			filters = request.GET.get('filters', None)
			if filters is not None:
				filters = json.loads(filters)
				related_model_fields = ['configuration','category','type','model','manufacturer']

				fields = {
					'offer_for':'offer_for', 
					'aircraft_status':'status',
				}
				for label, field in fields.items():
					if label in filters and filters[label]:
						self.queryset = self.queryset.filter(**{'{}__in'.format(field): filters[label]})


				for field in related_model_fields:
					if field in filters and filters[field]:
						self.queryset = self.queryset.filter(**{'{}_id__in'.format(field): filters[field]})

						# code for yom filter
			if filters is not None and 'yom_start' in filters:
				self.queryset = self.queryset.filter(Q(yom__gte = filters['yom_start']))

			if filters is not None and 'yom_end' in filters:
				self.queryset = self.queryset.filter(Q(yom__lte = filters['yom_end']))

			if filters is not None and 'yom_start' and 'yom_end' in filters:
				self.queryset = self.queryset.filter(Q(yom__gte = filters['yom_start']) & Q(yom__lte = filters['yom_end']))

			search = request.GET.get('search', None)
			if search is not None:
				self.queryset = self.queryset.filter(title__icontains=search.replace(' ', '-'))
	
			self.queryset = self.queryset.filter(isactivestatus='Approved',is_active_by_user=1).order_by('-is_featured','order_no')
		else:

			if (request.query_params.get('layout') == 'dashboard'):
				if isRoleUser(request.user):
					self.queryset = self.queryset.filter(user=request.user)[:4]
				else:
					self.queryset = self.queryset.filter(isactivestatus='Pending Approval')
			else:
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
		query_params = self.request.query_params
		frontend = query_params.get('frontend', None)
		if (instance.isactivestatus == 'Approved' and instance.is_active_by_user == 1 ) or (frontend is None and request.user.is_authenticated and (not isRoleUser(request.user) or request.user == instance.user)) :
			serializer = self.get_serializer(instance)
			data = serializer.data
			data['media'] = AbMedias.get_media(instance, 'App\\Aircraft', True)
			data['attachments'] = AbAttaches.get_attaches(instance, 'App\\Aircraft')
			try:
				data['user'] = to_dict(instance.user)
				try:
					data['user']['contact'] = to_dict(instance.user.contact)
				except:
					data['user']['contact'] = None
			except:
				data['user'] = None
			
			try:
				data['primary_contact'] = to_dict(instance.primary_contact)
				try:
					data['primary_contact']['job_title'] = to_dict(instance.primary_contact.job_title)
					data['primary_contact']['company'] = to_dict(instance.primary_contact.company)
					data['primary_contact']['country'] = to_dict(instance.primary_contact.country)
				except:
					data['primary_contact']['job_title'] = None
					data['primary_contact']['company'] = None
					data['primary_contact']['country'] = None
			except:
				data['primary_contact'] = None


			related_models = ['category','current_location','registration_country',
			'owner','current_operator', 'previous_operator', 'configuration', 'manager', 'seller', 'engine_model',
			'engine_type','engine_manufacturer']
			
			for model in related_models:
				try:
					data[model] = to_dict(getattr(instance, model))
				except:
					data[model] = None
		else:
			data = []
		return Response(data)

	def destroy(self, request, *args, **kwargs):
		resp = safe_delete(self, request, AbAircrafts)
		return resp

	@action(detail=False, methods=['POST'], name='aircraft_promote')
	def promote(self, request, *args, **kwargs):
		is_featured = request.data.get('is_featured', None)
		aircraft = AbAircrafts.objects.get(id=kwargs['pk'])
		response = {'type': 'error', 'message': 'Status update error'}
		if aircraft.is_featured != 1:
			if request.user.groups.filter(name="Admin").exists():
				aircraft.is_featured = 1
				aircraft.promotion_date = datetime.now()
				aircraft.save()
				response = {'type': 'success', 'message': 'Status has been updated successfully'}
			else:
				user_credits = AbCredits.objects.filter(pricing=AbPricing.objects.filter(name='Aircraft').first(), user=request.user)

				if user_credits.exists():
					credits_used = AbAircrafts.objects.filter(is_featured=1).count()
					if credits_used < user_credits.first().value:
						aircraft.is_featured = 1
						aircraft.promotion_date = datetime.now()
						aircraft.save()
						response = {'type': 'success', 'message': 'Status has been updated successfully'}
					else:
						response = {'type': 'error', 'message': 'Not enough credits'}
				else:
					response = {'type': 'error', 'message': 'No credits'}
		else:
			aircraft.is_featured = 0
			aircraft.promotion_date = None
			aircraft.save()
			response = {'type': 'success', 'message': 'Status has been updated successfully'}
		return Response(response, status=HTTP_200_OK)

	@action(detail=False, methods=['GET'], name='related_aircrafts')
	def related_aircrafts(self, request, *args, **kwargs):
		related_aircrafts = AbAircrafts.objects.filter(manufacturer=kwargs['manufacturer'], deleted_at=None, isactivestatus='Approved').exclude(id=kwargs['pk'])[0:4]
		relatedCount = related_aircrafts.count()
		if relatedCount < 4:
			other_aircrafts = AbAircrafts.objects.filter(deleted_at=None, isactivestatus='Approved').exclude(id=kwargs['pk'])
			for aircraft in related_aircrafts:
				other_aircrafts = other_aircrafts.exclude(id=aircraft.id)
			other_aircrafts	= other_aircrafts[0:4-relatedCount]

			related_aircrafts = related_aircrafts.union(other_aircrafts)
		serializer = self.get_serializer(related_aircrafts, many=True)
		return Response(serializer.data, status=HTTP_200_OK)

	@action(detail=False, methods=['GET'], name='promoted_aircrafts')
	def promoted_aircrafts(self, request, *args, **kwargs):
			promoted_aircrafts = AbAircrafts.objects.filter(is_featured=True)[0:4]
			serializer = self.get_serializer(promoted_aircrafts, many=True)
			return Response(serializer.data, status=HTTP_200_OK)

	@action(detail=False, methods=['GET'], name='aircraft_analytics')
	def analytics(self, request, *args, **kwargs):
		lastTenMonthDate = date.today().replace(day=1) + relativedelta(months=-9)
		thisMonth = date.today().replace(day = monthrange(date.today().year, date.today().month)[1]);

		model = request.GET.get('model');

		likeFavouriteById = like_and_favourite_by_id(kwargs['pk'], model, lastTenMonthDate, thisMonth);


		likeFavouriteByType = like_and_favourite_by_type(kwargs['pk'], model, lastTenMonthDate, thisMonth);


		 # return ['id'=>$this->getChartData($likes, $favourite), 'type'=>$this->getChartData($getTypeData[0], $getTypeData[1])];
		return Response({
			'likeFavouriteById': likeFavouriteById,
			'likeFavouriteByType' : likeFavouriteByType
			}, status=HTTP_200_OK)


class EnginesViewSet(CommonViewset, generics.RetrieveAPIView):

	queryset = AbEngines.objects.filter(deleted_at=None)
	serializer_class = EnginesSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	ordering_fields = ('id','title','esn')
	filter_fields = ('id','title','esn','isactivestatus')
	search_fields = ('id','title','esn')
	permission_classes = [IsAuthenticatedOrReadOnly]

	def list(self, request, *args, **kwargs):
		records = request.GET.get('records', None)
		# check call from frontend
		frontend = request.GET.get('frontend', False)
		if frontend:
			filters = request.GET.get('filters', None)
			if filters is not None:
				filters = json.loads(filters)
				related_model_fields = ['configuration','category','type','model','manufacturer']

				fields = {
					'offer_for':'offer_for', 
					'aircraft_status':'status'
				}
				for label, field in fields.items():
					if label in filters and filters[label]:
						self.queryset = self.queryset.filter(**{'{}__in'.format(field): filters[label]})


				for field in related_model_fields:
					if field in filters and filters[field]:
						self.queryset = self.queryset.filter(**{'{}_id__in'.format(field): filters[field]})

			# code for remaining cycle filter
			if filters is not None and 'engine_cycles_start' in filters:
				self.queryset = self.queryset.filter(Q(cycle_remaining__gte = filters['engine_cycles_start']))

			if filters is not None and 'engine_cycles_end' in filters:
				self.queryset = self.queryset.filter(Q(cycle_remaining__lte = filters['engine_cycles_end']))

			if filters is not None and 'engine_cycles_start' and 'engine_cycles_end' in filters:
				self.queryset = self.queryset.filter(Q(cycle_remaining__gte = filters['engine_cycles_start']) & Q(cycle_remaining__lte = filters['engine_cycles_end']))

			search = request.GET.get('search', None)
			if search is not None:
				self.queryset = self.queryset.filter(title__icontains=search.replace(' ','-'))

			self.queryset = self.queryset.filter(isactivestatus='Approved',is_active_by_user=1).order_by('-is_featured','order_no')
		else:

			if (request.query_params.get('layout') == 'dashboard'):
				if isRoleUser(request.user):
					self.queryset = self.queryset.filter(user=request.user)[:4]
				else:
					self.queryset = self.queryset.filter(isactivestatus='Pending Approval')
			else:
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
		query_params = self.request.query_params
		frontend = query_params.get('frontend', None)
		if (instance.isactivestatus == 'Approved' and instance.is_active_by_user == 1) or (frontend is None and request.user.is_authenticated and (not isRoleUser(request.user) or request.user == instance.user)) :
			serializer = self.get_serializer(instance)
			data = serializer.data
			data['media'] = AbMedias.get_media(instance, 'App\\Engine', True)
			data['attachments'] = AbAttaches.get_attaches(instance, 'App\\Engine')
			try:
				user = AbUsers.objects.filter(id=instance.user.id)
				contact = user.first().contact.values()[0]
				data['user'] = user.values()[0]
				data['user']['contact'] = contact
			except:
				data['user'] = None
			
			try:
				data['primary_contact'] = to_dict(instance.primary_contact)
				try:
					data['primary_contact']['job_title'] = to_dict(instance.primary_contact.job_title)
					data['primary_contact']['company'] = to_dict(instance.primary_contact.company)
					data['primary_contact']['country'] = to_dict(instance.primary_contact.country)
				except:
					data['primary_contact']['job_title'] = None
					data['primary_contact']['company'] = None
					data['primary_contact']['country'] = None
			except:
				data['primary_contact'] = None

			related_models = ['category','type','model','manufacturer','current_location','owner','seller']
			
			for model in related_models:
				try:
					data[model] = to_dict(getattr(instance, model))
				except:
					data[model] = None
		else:
			data = []
		return Response(data)

	def destroy(self, request, *args, **kwargs):
		resp = safe_delete(self, request, AbEngines)
		return resp

	@action(detail=False, methods=['POST'], name='engine_promote')
	def promote(self, request, *args, **kwargs):
		is_featured = request.data.get('is_featured', None)
		engine = AbEngines.objects.get(id=kwargs['pk'])
		response = {'type':'error', 'message': 'Status update error'}
		if engine.is_featured != 1:
			if request.user.groups.filter(name="Admin").exists():
				engine.is_featured = 1
				engine.promotion_date = datetime.now()
				engine.save()
				response = {'type': 'success', 'message': 'Status has been updated successfully'}
			else:
				user_credits = AbCredits.objects.filter(pricing=AbPricing.objects.filter(name='Engine').first(), user=request.user)

				if user_credits.exists():
					credits_used = AbEngines.objects.filter(is_featured=1).count()
					if credits_used < user_credits.first().value:
						engine.is_featured = 1
						engine.promotion_date = datetime.now()
						engine.save()
						response = {'type': 'success', 'message': 'Status has been updated successfully'}
					else:
						response = {'type': 'error', 'message': 'Not enough credits'}
				else:
					response = {'type': 'error', 'message': 'No credits'}
		else:
			engine.is_featured = 0
			engine.promotion_date = None
			engine.save()
			response = {'type': 'success', 'message': 'Status has been updated successfully'}
		return Response(response, status=HTTP_200_OK)

	@action(detail=False, methods=['GET'], name='related_engines')
	def related_engines(self, request, *args, **kwargs):
		related_engines = AbEngines.objects.filter(manufacturer=kwargs['manufacturer'], deleted_at=None, isactivestatus='Approved').exclude(id=kwargs['pk'])[0:4]
		relatedCount = related_engines.count()
		if relatedCount < 4:
			other_related = AbEngines.objects.filter(deleted_at=None, isactivestatus='Approved').exclude(id=kwargs['pk'])
			for engine in related_engines:
				other_related = other_related.exclude(id=engine.id)
			other_related	= other_related[0:4-relatedCount]

			related_engines = related_engines.union(other_related)
		serializer = self.get_serializer(related_engines, many=True)
		return Response(serializer.data, status=HTTP_200_OK)

	@action(detail=False, methods=['GET'], name='promoted_engines')
	def promoted_engines(self, request, *args, **kwargs):
			promoted_engines = AbEngines.objects.filter(is_featured=True)[0:4]
			serializer = self.get_serializer(promoted_engines, many=True)
			return Response(serializer.data, status=HTTP_200_OK)

	@action(detail=False, methods=['GET'], name='engine_analytics')
	def analytics(self, request, *args, **kwargs):
		lastTenMonthDate = date.today().replace(day=1) + relativedelta(months=-9)
		thisMonth = date.today().replace(day = monthrange(date.today().year, date.today().month)[1]);

		model = request.GET.get('model');

		likeFavouriteById = like_and_favourite_by_id(kwargs['pk'], model, lastTenMonthDate, thisMonth);


		likeFavouriteByType = like_and_favourite_by_type(kwargs['pk'], model, lastTenMonthDate, thisMonth);

		return Response({
			'likeFavouriteById': likeFavouriteById,
			'likeFavouriteByType' : likeFavouriteByType
			}, status=HTTP_200_OK)


class ApusViewSet(CommonViewset, generics.RetrieveAPIView):

	queryset = AbApus.objects.filter(deleted_at=None)
	serializer_class = ApusSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	ordering_fields = ('id','title',)
	filter_fields = ('id','title','isactivestatus')
	search_fields = ('id','title',)
	permission_classes = [IsAuthenticatedOrReadOnly]

	def list(self, request, *args, **kwargs):
		records = request.GET.get('records', None)
		# check call from frontend
		frontend = request.GET.get('frontend', False)
		if frontend:
			filters = request.GET.get('filters', None)
			if filters is not None:
				filters = json.loads(filters)
				related_model_fields = ['configuration','category','type','model','manufacturer']

				fields = {
					'offer_for':'offer_for', 
					'aircraft_status':'status'
				}
				for label, field in fields.items():
					if label in filters and filters[label]:
						self.queryset = self.queryset.filter(**{'{}__in'.format(field): filters[label]})


				for field in related_model_fields:
					if field in filters and filters[field]:
						self.queryset = self.queryset.filter(**{'{}_id__in'.format(field): filters[field]})

					# code for remaining cycle filter
			if filters is not None and 'apu_cycles_start' in filters:
				self.queryset = self.queryset.filter(Q(cycle_remaining__gte = filters['apu_cycles_start']))

			if filters is not None and 'apu_cycles_end' in filters:
				self.queryset = self.queryset.filter(Q(cycle_remaining__lte = filters['apu_cycles_end']))

			if filters is not None and 'apu_cycles_start' and 'apu_cycles_end' in filters:
				self.queryset = self.queryset.filter(Q(cycle_remaining__gte = filters['apu_cycles_start']) & Q(cycle_remaining__lte = filters['apu_cycles_end']))

			search = request.GET.get('search', None)
			if search is not None:
				self.queryset = self.queryset.filter(title__icontains=search.replace(' ','-'))

			self.queryset = self.queryset.filter(isactivestatus='Approved',is_active_by_user=1).order_by('-is_featured','order_no')

		else:

			if (request.query_params.get('layout') == 'dashboard'):
				if isRoleUser(request.user):
					self.queryset = self.queryset.filter(user=request.user)[:4]
				else:
					self.queryset = self.queryset.filter(isactivestatus='Pending Approval')
			else:
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
		query_params = self.request.query_params
		frontend = query_params.get('frontend', None)
		if (instance.isactivestatus == 'Approved' and instance.is_active_by_user == 1 ) or (frontend is None and request.user.is_authenticated and (not isRoleUser(request.user) or request.user == instance.user)):
			serializer = self.get_serializer(instance)
			data = serializer.data
			data['media'] = AbMedias.get_media(instance, 'App\\Apu', True)
			data['attachments'] = AbAttaches.get_attaches(instance, 'App\\Apu')
			try:
				user = AbUsers.objects.filter(id=instance.user.id)
				contact = user.first().contact.values()[0]
				data['user'] = user.values()[0]
				data['user']['contact'] = contact
			except:
				data['user'] = None
			
			try:
				data['primary_contact'] = to_dict(instance.primary_contact)
				try:
					data['primary_contact']['job_title'] = to_dict(instance.primary_contact.job_title)
					data['primary_contact']['company'] = to_dict(instance.primary_contact.company)
					data['primary_contact']['country'] = to_dict(instance.primary_contact.country)
				except:
					data['primary_contact']['job_title'] = None
					data['primary_contact']['company'] = None
					data['primary_contact']['country'] = None
			except:
				data['primary_contact'] = None

			related_models = ['category','type','model','manufacturer','current_location','owner','seller']
			
			for model in related_models:
				try:
					data[model] = to_dict(getattr(instance, model))
				except:
					data[model] = None
		else:
			data = []
				
		return Response(data)

	def destroy(self, request, *args, **kwargs):
		resp = safe_delete(self, request, AbApus)
		return resp

	@action(detail=False, methods=['POST'], name='apu_promote')
	def promote(self, request, *args, **kwargs):
		is_featured = request.data.get('is_featured', None)
		apu = AbApus.objects.get(id=kwargs['pk'])
		response = {'type':'error', 'message': 'Status update error'}
		if apu.is_featured != 1:
			if request.user.groups.filter(name="Admin").exists():
				apu.is_featured = 1
				apu.promotion_date = datetime.now()
				apu.save()
				response = {'type': 'success', 'message': 'Status has been updated successfully'}
			else:
				user_credits = AbCredits.objects.filter(pricing=AbPricing.objects.filter(name='Apu').first(), user=request.user)

				if user_credits.exists():
					credits_used = AbApus.objects.filter(is_featured=1).count()
					if credits_used < user_credits.first().value:
						apu.is_featured = 1
						apu.promotion_date = datetime.now()
						apu.save()
						response = {'type': 'success', 'message': 'Status has been updated successfully'}
					else:
						response = {'type': 'error', 'message': 'Not enough credits'}
				else:
					response = {'type': 'error', 'message': 'No credits'}
		else:
			apu.is_featured = 0
			apu.promotion_date = None
			apu.save()
			response = {'type': 'success', 'message': 'Status has been updated successfully'}
		return Response(response, status=HTTP_200_OK)

	@action(detail=False, methods=['GET'], name='related_apus')
	def related_apus(self, request, *args, **kwargs):
		related_apus = AbApus.objects.filter(manufacturer=kwargs['manufacturer'], deleted_at=None, isactivestatus='Approved').exclude(id=kwargs['pk'])[0:4]
		relatedCount = related_apus.count()
		if relatedCount < 4:
			other_related = AbApus.objects.filter(deleted_at=None, isactivestatus='Approved').exclude(id=kwargs['pk'])
			for apu in related_apus:
				other_related = other_related.exclude(id=apu.id)

			other_related = other_related[0:4-relatedCount]
			related_apus = related_apus.union(other_related)

		serializer = self.get_serializer(related_apus, many=True)
		return Response(serializer.data, status=HTTP_200_OK)

	@action(detail=False, methods=['GET'], name='promoted_apus')
	def promoted_apus(self, request, *args, **kwargs):
			promoted_apus = AbApus.objects.filter(is_featured=True)[0:4]
			serializer = self.get_serializer(promoted_apus, many=True)
			return Response(serializer.data, status=HTTP_200_OK)

	@action(detail=False, methods=['GET'], name='apu_analytics')
	def analytics(self, request, *args, **kwargs):
		lastTenMonthDate = date.today().replace(day=1) + relativedelta(months=-9)
		thisMonth = date.today().replace(day = monthrange(date.today().year, date.today().month)[1]);

		model = request.GET.get('model');

		likeFavouriteById = like_and_favourite_by_id(kwargs['pk'], model, lastTenMonthDate, thisMonth);


		likeFavouriteByType = like_and_favourite_by_type(kwargs['pk'], model, lastTenMonthDate, thisMonth);

		return Response({
			'likeFavouriteById': likeFavouriteById,
			'likeFavouriteByType' : likeFavouriteByType
			}, status=HTTP_200_OK)


class PartsViewSet(CommonViewset, generics.RetrieveAPIView):

	queryset = AbParts.objects.filter(deleted_at=None)
	serializer_class = PartsSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	ordering_fields = ('id','title',)
	filter_fields = ('id','is_active',)
	search_fields = ('id','title',)
	permission_classes = [IsAuthenticatedOrReadOnly]

	def list(self, request, *args, **kwargs):
		records = request.GET.get('records', None)
		# check call from frontend
		frontend = request.GET.get('frontend', False)
		if frontend:
			filters = request.GET.get('filters', None)
			search = request.GET.get('search', None)
			parts = request.GET.get('parts', None)
			if filters is not None:
				filters = json.loads(filters)
				related_model_fields = ['condition','location']

				for field in related_model_fields:
					if field == 'condition' and field in filters and 'all' in filters[field]:
						continue
					if field in filters and filters[field]:
						self.queryset = self.queryset.filter(**{'{}_id__in'.format(field): filters[field]})

				# if no condition then don't show any record 
				if filters and 'condition' in related_model_fields and ('condition' not in filters or (not parts and not filters['condition'])): 
					self.queryset = self.queryset.filter(id__lt = 1)
			if search is not None:
				self.queryset = self.queryset.filter(title__icontains=search.replace(' ', '-'))

			if parts is not None:
				filter_kwargs = {} 
				Qr = None
				for part in parts.split():
					q = Q(part_number__icontains=part.strip())
					if Qr:
						Qr = Qr | q # or & for filtering
					else:
						Qr = q
				if Qr is not None:
					self.queryset = self.queryset.filter(Qr)

			self.queryset = self.queryset.filter(is_active=1).order_by('order_no')

		else:

			if (request.query_params.get('layout') == 'dashboard'):
				if isRoleUser(request.user):
					self.queryset = self.queryset.filter(user=request.user)[:4]
				else:
					self.queryset = self.queryset.filter(isactivestatus='Pending Approval')
			else:
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
		query_params = self.request.query_params
		frontend = query_params.get('frontend', None)
		if (instance.is_active == 1) or (frontend is None and request.user.is_authenticated and (not isRoleUser(request.user) or request.user == instance.user)):
			serializer = self.get_serializer(instance)
			data = serializer.data
			try:
				user = AbUsers.objects.filter(id=instance.user.id)
				contact = user.first().contact.values()[0]
				data['user'] = user.values()[0]
				data['user']['contact'] = contact
			except:
				data['user'] = None
			
			try:
				data['primary_contact'] = to_dict(instance.primary_contact)
				try:
					data['primary_contact']['job_title'] = to_dict(instance.primary_contact.job_title)
					data['primary_contact']['company'] = to_dict(instance.primary_contact.company)
					data['primary_contact']['country'] = to_dict(instance.primary_contact.country)
				except:
					data['primary_contact']['job_title'] = None
					data['primary_contact']['company'] = None
					data['primary_contact']['country'] = None
			except:
				data['primary_contact'] = None

			related_models = ['condition','owner','seller','release', 'location']
			
			for model in related_models:
				try:
					data[model] = to_dict(getattr(instance, model))
				except:
					data[model] = None
		else :
			data = []			

		return Response(data)

	def destroy(self, request, *args, **kwargs):
		resp = safe_delete(self, request, AbParts)
		return resp
	
	@action(detail=False, methods=['GET'], name='promoted_parts')
	def promoted_parts(self, request, *args, **kwargs):
		promoted_parts = AbParts.objects.filter(is_featured=True)[0:4]
		serializer = self.get_serializer(promoted_parts, many=True)
		return Response(serializer.data, status=HTTP_200_OK)

	@action(detail=False, methods=['POST'], name='send_rfq_message')
	def send_rfq_message(self, request, *args, **kwargs):
		part_requests = request.data.get('part_requests')
		message = request.data.get('message')
		year = datetime.now().year
		prs = {};
		parts = AbParts.objects.filter(id__in=[pr['id'] for pr in part_requests])
		for p in parts:
			contact = p.user.contact.first()

			if  contact and contact.company and contact.company.rfq_email:
				rfq_email = contact.company.rfq_email

				for pr in part_requests:
					if pr['id'] == p.id:
						p.qty = pr['qty'] if 'qty' in pr else 1

				if rfq_email in prs:
					prs[rfq_email].append(p)
				else:
					prs[rfq_email] = [p]

		if prs:
			email_template = AbCannedemails.objects.get(message_type='parts-rfq')
		
			for email in prs:
				subject = email_template.subject 
				contact = prs[email][0].user.contact.first()
				sender = request.user.contact.first()
				context = {
					'user': "{} {}".format(contact.first_name, contact.last_name),
					'sender':"{} {}".format(sender.first_name, sender.last_name),
					'sender_email':request.user.email,
					'message':message,
					'parts':mark_safe(get_template('email/part/send_rfq_message.html').render({'base_url':settings.SITE_URL,'part_requests':prs[email]})),
				}
				context = {'email_content': Template(mark_safe(email_template.message)).render(Context(context))}
				context['footer_message'] = Template(mark_safe(email_template.footer_message)).render(Context({'asset':email_template.footer_message}))
				context['year'] = year
				html_content = get_template('email/canned/general.html').render(context)

				send_emails(subject, html_content, [email], email_template.sending_email)

		return Response({'success':True, 'message':'RFQ has been send'}, status=HTTP_200_OK)

class WantedsViewSet(CommonViewset, generics.RetrieveAPIView):

	queryset = AbWanteds.objects.filter(deleted_at=None)
	serializer_class = WantedsSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	ordering_fields = ('id','title',)
	filter_fields = ('id','is_active',)
	search_fields = ('id','title',)
	permission_classes = [IsAuthenticatedOrReadOnly]

	def list(self, request, *args, **kwargs):
		records = request.GET.get('records', None)
		# check call from frontend
		frontend = request.GET.get('frontend', False)
		if frontend:
			filters = request.GET.get('filters', None)
			if filters is not None:
				filters = json.loads(filters)
				related_model_fields = ['country']

				fields = {
					'terms':'terms',
					'type':'type',

				}
				for label, field in fields.items():
					if label in filters and filters[label]:
						self.queryset = self.queryset.filter(**{'{}__in'.format(field): filters[label]})


				for field in related_model_fields:
					if field in filters and filters[field]:
						self.queryset = self.queryset.filter(**{'{}_id__in'.format(field): filters[field]})


			search = request.GET.get('search', None)
			if search is not None:
				self.queryset = self.queryset.filter(title__icontains=search.replace(' ', '-'))
				
			self.queryset = self.queryset.filter(is_published=1,is_active=1).order_by('-is_featured','order_no')
		else:

			if (request.query_params.get('layout') == 'dashboard'):
				if isRoleUser(request.user):
					self.queryset = self.queryset.filter(user=request.user)[:4]
			else:
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
		query_params = self.request.query_params
		frontend = query_params.get('frontend', None)
		if (instance.is_active == 1) or (frontend is None and request.user.is_authenticated and (not isRoleUser(request.user) or request.user == instance.user)) :
			serializer = self.get_serializer(instance)
			data = serializer.data
			try:
				user = AbUsers.objects.filter(id=instance.user.id)
				contact = user.first().contact.values()[0]
				data['user'] = user.values()[0]
				data['user']['contact'] = contact
			except:
				data['user'] = None
			
			try:
				data['primary_contact'] = to_dict(instance.primary_contact)
				try:
					data['primary_contact']['job_title'] = to_dict(instance.primary_contact.job_title)
					data['primary_contact']['company'] = to_dict(instance.primary_contact.company)
					data['primary_contact']['country'] = to_dict(instance.primary_contact.country)
				except:
					data['primary_contact']['job_title'] = None
					data['primary_contact']['company'] = None
					data['primary_contact']['country'] = None
			except:
				data['primary_contact'] = None

			related_models = ['country','manufacturer','type_0','model']
			
			for model in related_models:
				try:
					data[model] = to_dict(getattr(instance, model))
				except:
					data[model] = None
		else :
			data = []			

		return Response(data)

	def destroy(self, request, *args, **kwargs):
		resp = safe_delete(self, request, AbWanteds)
		return resp

	@action(detail=False, methods=['POST'], name='wanted_promote')
	def promote(self, request, *args, **kwargs):
		is_featured = request.data.get('is_featured', None)
		wanted = AbWanteds.objects.get(id=kwargs['pk'])
		response = {'type':'error', 'message': 'Status update error'}
		if wanted.is_featured != 1:
			if request.user.groups.filter(name="Admin").exists():
				wanted.is_featured = 1
				wanted.promotion_date = datetime.now()
				wanted.save()
				response = {'type': 'success', 'message': 'Status has been updated successfully'}
			else:
				user_credits = AbCredits.objects.filter(pricing=AbPricing.objects.filter(name='Wanted').first(), user=request.user)

				if user_credits.exists():
					credits_used = AbWanteds.objects.filter(is_featured=1).count()
					if credits_used < user_credits.first().value:
						wanted.is_featured = 1
						wanted.promotion_date = datetime.now()
						wanted.save()
						response = {'type': 'success', 'message': 'Status has been updated successfully'}
					else:
						response = {'type': 'error', 'message': 'Not enough credits'}
				else:
					response = {'type': 'error', 'message': 'No credits'}
		else:
			wanted.is_featured = 0
			wanted.promotion_date = None
			wanted.save()
			response = {'type': 'success', 'message': 'Status has been updated successfully'}
		return Response(response, status=HTTP_200_OK)

	@action(detail=False, methods=['GET'], name='related_wanteds')
	def related_wanteds(self, request, *args, **kwargs):
		related_wanteds = AbWanteds.objects.filter(manufacturer=kwargs['manufacturer'], deleted_at=None, is_published=1).exclude(id=kwargs['pk'])[0:4]
		relatedCount = related_wanteds.count()
		if relatedCount < 4:
			other_related = AbWanteds.objects.filter(deleted_at=None, is_published=1).exclude(id=kwargs['pk'])
			for wanted in related_wanteds:
				other_related = other_related.exclude(id=wanted.id)
			other_related	= other_related[0:4-relatedCount]

			related_wanteds = related_wanteds.union(other_related)
		serializer = self.get_serializer(related_wanteds, many=True)
		return Response(serializer.data, status=HTTP_200_OK)
			
	@action(detail=False, methods=['GET'], name='promoted_wanteds')
	def promoted_wanteds(self, request, *args, **kwargs):
			promoted_wanteds = AbWanteds.objects.filter(is_featured=True)[0:4]
			serializer = self.get_serializer(promoted_wanteds, many=True)
			return Response(serializer.data, status=HTTP_200_OK)
	
class AirportsViewSet(CommonViewset, generics.RetrieveAPIView):

	queryset = AbAirports.objects.filter(deleted_at=None)
	serializer_class = AirportsSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	ordering_fields = ('id','name','city__name','country__name','iata_code','icao_code', 'description')
	filter_fields = ('id','is_active')
	search_fields = ('id','name','city__name','country__name','iata_code','icao_code')
	permission_classes = [IsAuthenticatedOrReadOnly]

	def list(self, request, *args, **kwargs):
		records = request.GET.get('records', None)
		# check call from frontend
		frontend = request.GET.get('frontend', False)
		if frontend:
			filters = request.GET.get('filters', None)
			if filters is not None:
				filters = json.loads(filters)
				related_model_fields = ['country','airfield_type']

				for field in related_model_fields:
					if field in filters and filters[field]:
						self.queryset = self.queryset.filter(**{'{}_id__in'.format(field): filters[field]})

			search = request.GET.get('search', None)
			if search is not None:
				self.queryset = self.queryset.filter(name__icontains=search.replace(' ', '-'))
			
			self.queryset = self.queryset.filter(is_active=1).order_by('order_no')
		
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
		query_params = self.request.query_params
		frontend = query_params.get('frontend', None)
		if (instance.is_active == 1) or (frontend is None and request.user.is_authenticated and (not isRoleUser(request.user) or request.user == instance.user))  :
			serializer = self.get_serializer(instance)
			data = serializer.data
			try:
				data['user'] = to_dict(instance.user)
				try:
					data['user']['contact'] = to_dict(instance.user.contact)
				except:
					data['user']['contact'] = None
			except:
				data['user'] = None

			related_models = ['state','airfield_type']
			
			for model in related_models:
				try:
					data[model] = to_dict(getattr(instance, model))
				except:
					data[model] = None
		else :
			data = []			

		return Response(data)

	def destroy(self, request, *args, **kwargs):
		resp = safe_delete(self, request, AbAirports)
		return resp

	@action(detail=False, methods=['GET'], name='related_airports')
	def related_airports(self, request, *args, **kwargs):
		related_airports = AbAirports.objects.filter(country=kwargs['country'], deleted_at=None, is_active=1).exclude(id=kwargs['pk'])[0:4]
		relatedCount = related_airports.count()
		if relatedCount < 4:
			other_related = AbAirports.objects.filter(deleted_at=None, is_active=1).exclude(id=kwargs['pk'])
			for airport in related_airports:
				other_related = other_related.exclude(id=airport.id)
			other_related = other_related[0:4-relatedCount]

			related_airports = related_airports.union(other_related)
		serializer = self.get_serializer(related_airports, many=True)
		return Response(serializer.data, status=HTTP_200_OK)

class AirfieldTypesViewSet(CommonViewset, generics.RetrieveAPIView):

	queryset = AbAirfieldTypes.objects.filter(deleted_at=None)
	serializer_class = AirfieldTypesSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	ordering_fields = ('id','name',)
	filter_fields = ('id','is_active',)
	search_fields = ('id','name',)

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
		resp = safe_delete(self, request, AbAirfieldTypes)
		return resp


class EventsViewSet(CommonViewset, generics.RetrieveAPIView):
	queryset = AbEvents.objects.filter(deleted_at=None)
	serializer_class = EventsSerializer
	filter_backends = (filters.OrderingFilter, filters.SearchFilter,)
	ordering_fields = ('id', 'title','start_date','end_date','categories')
	filter_fields = ('id', 'is_active')
	search_fields = ('id', 'title','start_date','end_date','categories__name')
	permission_classes = [IsAuthenticatedOrReadOnly]


	def list(self, request, *args, **kwargs):
		records = request.GET.get('records', None)
		# check call from frontend
		frontend = request.GET.get('frontend', False)
		if frontend:
			filters = request.GET.get('filters', None)
			if filters is not None:
				filters = json.loads(filters)
				related_model_fields = ['configuration','category','type','model','manufacturer']

				fields = {
					'offer_for':'offer_for', 
					'aircraft_status':'status'
				}
				for label, field in fields.items():
					if label in filters and filters[label]:
						self.queryset = self.queryset.filter(**{'{}__in'.format(field): filters[label]})


				for field in related_model_fields:
					if field in filters and filters[field]:
						self.queryset = self.queryset.filter(**{'{}_id__in'.format(field): filters[field]})

		
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
		data['media'] = AbMedias.get_media(instance, 'App\\Event')

		related_models = ['country','region','continent','state','city']
		
		for model in related_models:
			try:
				data[model] = to_dict(getattr(instance, model))
			except:
				data[model] = None

		return Response(data)


	def destroy(self, request, *args, **kwargs):
		resp = safe_delete(self, request, AbEvents)
		return resp

	@action(detail=False, methods=['GET'], name='related_events')
	def related_events(self, request, *args, **kwargs):
			event = AbEvents.objects.get(id=kwargs['pk']) 
			related_events = AbEvents.objects.filter(is_active=event.is_active).exclude(id=event.id)[0:4]
			serializer = self.get_serializer(related_events, many=True)
			return Response(serializer.data, status=HTTP_200_OK)
	
	@action(detail=False, methods=['GET'], name='promoted_events')
	def promoted_events(self, request, *args, **kwargs):
			promoted_events = AbEvents.objects.filter(is_featured=True)[0:4]
			serializer = self.get_serializer(promoted_events, many=True)
			return Response(serializer.data, status=HTTP_200_OK)



class SettingsViewSet(CommonViewset, generics.RetrieveAPIView):
	queryset = AbSettings.objects.all()
	serializer_class = AbSettingsSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	filter_fields = ('id','type',)

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

	def bulk_update(self, request, *args, **kwargs):
		allowed_keys = ['first_notify','second_notify','third_notify','expired_notify']
		try:
			settings = AbSettings.objects.filter(key__in=allowed_keys)
			for setting in settings:
				setting.value = request.data.get(setting.key)
				setting.save()

			return Response({'message':'Settings updated successfully', 'success':True}, status=HTTP_200_OK)
		except:
			return Response({'message':'Error Occured', 'success':False}, status=HTTP_200_OK)
		

@csrf_exempt
def paytab_ipn(request):
	transaction_id = request.POST.get('transaction_id', None)
	print('Paytab_ipn is called', flush=True)
	print(request.POST, flush=True)
	if transaction_id is not None:
		response_code = request.POST.get('response_code',0)
		if response_code in [100, 5001, 5002]:
			trans_date = request.POST.get('datetime')
			trans_date = datetime.datetime.strptime(trans_date, '%d-%m-%Y %I:%M:%S %p')
			# reference_no - combination of Ref-UserId-OrderId-RandomString
			ref_no = request.POST.get('reference_id','').split('-')
			user = AbUsers.objects.get(id=ref_no[1])
			user.order_id = ref_no[2]
			user.trans_date = trans_date
			user.card_brand = request.POST.get('card_brand','')
			user.card_last_four = request.POST.get('last_4_digits','')
			user.transaction_id = transaction_id
			# user.trial_ends_at = trans_date + 30/365 days - not sure if needed051
			user.save()

			# activate user credits
			user.abcredits_set.filter(is_active=0).update(is_active=1)

		# save transcation information
		AbPaymentHistories(
			user=user,
			transaction_id=transaction_id,
			order_id=ref_no[2],
			response_code=response_code,
			response_message=request.POST.get('detail',''),
			customer_name=request.POST.get('customer_name',''),
			customer_email=request.POST.get('customer_email',''),
			transaction_amount=request.POST.get('transaction_amount',0),
			transaction_currency=request.POST.get('transaction_currency',''),
			customer_phone=request.POST.get('customer_phone',''),
			first_4_digits=request.POST.get('first_4_digits',''),
			last_4_digits=request.POST.get('last_4_digits',''),
			card_brand=request.POST.get('card_brand',''),
			trans_date=trans_date,
			pt_token=request.POST.get('response_code',''),
			secure_sign=request.POST.get('response_code',''),
			status=1
			# pt_customer_email=request.POST.get('response_code',''),
			# pt_customer_password=request.POST.get('response_code',''),
		).save()
		print('Success:Transaction {} inserted into database'.format(transaction_id), flush=True)
	else:
		print('Failed! Transaction_id not found')

@csrf_exempt
def paytab_callback(request):
	print('response data is')
	print(request.POST)
	return HttpResponseRedirect('{}/user/promote'.format(settings.SITE_URL))

@csrf_exempt
@api_view(["POST"])
def paytab_createPage(request):
	order_id = request.data.get('o_id')
	plan = AbPlans.objects.get(id=request.data.get('plan'));
	if plan.id == 2:
		# save user selected credits 
		credits_types = ['aircraft','engine','apu']
		price = 0
		abCredits = []
		for credit_type in credits_types:
			qty = request.data.get('{}_qty'.format(credit_type))
			try:
				price += getattr(plan, '{}_value'.format(credit_type)) * qty
			except:
				pass
			abCredits.append(AbCredits(plan=plan, user=request.user, credits_type=credit_type, value=qty))

		AbCredits.objects.bulk_create(abCredits)
		plan.price = price
	
	resposne = createPayTabPage(request, plan, order_id)
	return Response(resposne, status=HTTP_200_OK)

@api_view(["POST"])
def liked(request):
	model = request.data.get('path')
	id = request.data.get('id')

	allowed_models = [
		'Aircraft','Engine','Apu','Wanted']

	queryset = None
	# check if model is allowed 
	if model in allowed_models:
		model_db = globals()['Ab{}s'.format(model)] # make model object
		model_obj = model_db.objects.get(id=id)
		
		# updates likes
		likes = AbLikes.objects.filter(likable_id=id,likable_type = 'App\\{}'.format(model),user=request.user).first()
		if likes is not None:
			model_obj.likes = model_obj.likes - 1
			likes.delete()
		else:
			model_obj.likes = model_obj.likes + 1
			# add entry in likes model
			AbLikes.objects.create(
				likable_id= id,
				likable_type = 'App\\{}'.format(model),
				user = request.user
				)
		model_obj.save()
	return Response({'likes':model_obj.likes}, status=HTTP_200_OK)


@api_view(["POST"])
def airport_suggest_correction(request):
	year = datetime.now().year
	context = {
		'data': request.data, 
	}
	try:
		context['user'] = request.user.contact.values()[0]
		context['user'] = '{} {}'.format(context['user'].first_name, context['user'].last_name)
	except:
		context['user'] = request.user.email

	message_content = get_template('email/airport/suggest_correction.html').render(context)

	subject = 'Airport - New correction suggested '
	context = {'email_content': mark_safe(message_content), 'year': year}
	html_content = get_template('email/canned/static_footer.html').render(context)
	send_emails(subject, html_content, ['admin@airbook.xbs.cloud'])
	return Response({"status":"Correction send successfully"}, status=HTTP_200_OK)

@csrf_exempt
@api_view(["POST"])
@permission_classes((AllowAny,))
@authentication_classes([])
def randomize_ordering(request, model):
	allowed_models = ['AbAircrafts', 'AbEngines', 'AbApus', 'AbParts', 'AbWanteds', 'AbAirports','AbContacts', 'AbCompanies']

	if model in allowed_models:
		model = globals()[model]
		data = model.objects.filter(deleted_at=None)
		for i in range(len(data)):
			data[i].order_no = randrange(10000)

		model.objects.bulk_update(data, ['order_no'])


	return Response(status=HTTP_200_OK) 
	
 
 
@csrf_exempt
@api_view(["GET"])
@permission_classes((AllowAny,))
@authentication_classes([])
def home_contents(request):
	aircraft = AbAircrafts.objects.filter(isactivestatus= "approved", is_active_by_user=1, deleted_at= None).order_by('?')[:7].values()
	engine = AbEngines.objects.filter(isactivestatus= "approved", is_active_by_user=1, deleted_at= None).order_by('?')[:7].values()
	apu = AbApus.objects.filter(isactivestatus= "approved", is_active_by_user=1, deleted_at= None).order_by('?')[:7].values()
	wanted = AbWanteds.objects.filter(is_published=1,is_active=1, deleted_at= None).order_by('?')[:7].values()
	aircraft_manufacturer = AbManufacturers.objects.filter(is_active=1,deleted_at= None,id__in=AbAircrafts.objects.filter(isactivestatus= "approved",is_active_by_user=1, deleted_at= None).values_list('manufacturer_id', flat=True)).order_by('id')[:6].values()
	engine_manufacturer = AbManufacturers.objects.filter(is_active=1,deleted_at= None,id__in=AbEngines.objects.filter(isactivestatus= "approved",is_active_by_user=1, deleted_at= None).values_list('manufacturer_id', flat=True)).order_by('id')[:6].values()
	apu_manufacturer = AbManufacturers.objects.filter(is_active=1,deleted_at= None,id__in=AbApus.objects.filter(isactivestatus= "approved",is_active_by_user=1, deleted_at= None).values_list('manufacturer_id', flat=True)).order_by('id')[:6].values()
	content = {
        'aircraft': aircraft,
        'engine': engine,
        'apu': apu,
        'wanted': wanted,
		'aircraft_manufacturer' : aircraft_manufacturer,
		'engine_manufacturer' : engine_manufacturer,
		'apu_manufacturer' : apu_manufacturer,
    }
	return Response(content, status=HTTP_200_OK)
    
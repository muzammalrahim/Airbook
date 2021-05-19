import datetime

from django.shortcuts import render
from connect.models import *
from account.models import AbUsers , AbManufacturers,AbTypes,AbModels, AbSubscribers,AbTitles, AbSuggestions
from item.models import *
from django.contrib.auth.models import Group ,Permission
from account.serializers import *
from rest_framework.decorators import api_view, action
from rest_framework import viewsets,permissions,filters, mixins, generics
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.views import APIView
from rest_framework.reverse import reverse
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.status import (
	HTTP_400_BAD_REQUEST,
	HTTP_401_UNAUTHORIZED,
	HTTP_404_NOT_FOUND,
	HTTP_200_OK,
	HTTP_204_NO_CONTENT
)
from rest_framework.response import Response
from django.http import Http404
from django.contrib.contenttypes.models import ContentType
import json
from django.db.models import Q
from info.models import *
from rest_framework_datatables.filters import DatatablesFilterBackend
from connect.views import safe_delete
from default.views import CommonViewset, CustomTokenAuthentication
from default.services import getPlanNameAndType, makeRequestDict,isRoleUser, send_emails, id_generator, validFieldValue
from django.forms.models import model_to_dict
from django.conf import settings
from django.utils.safestring import mark_safe
from django.template.loader import get_template
from django.template import Template, Context

# from auditlog.models import LogEntry
# Create your views here.


# ---------User views --------------#
class UserViewSet(CommonViewset, generics.RetrieveAPIView):

	queryset = AbUsers.objects.filter(deleted_at=None)
	serializer_class = UsersSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	ordering_fields = ('id', 'email',)
	filter_fields = ('email', 'groups__name','is_active','contact__first_name')
	search_fields = ('email','contact__first_name', 'contact__last_name' )

	def get_permissions(self):
		if self.action == 'create':
			return [AllowAny(), ]        
		return super(UserViewSet, self).get_permissions()

	def get_authenticators(self):
		authenticators = super().get_authenticators()
		method = self.request.method.lower()
		if method == 'post':
			return [CustomTokenAuthentication()]
		else:
			return authenticators
		
	def list(self, request, *args, **kwargs):
		records = request.GET.get('records', None)
		not_group = request.GET.get('not_group', None)
		queryset = self.get_queryset()
		queryset = queryset.filter(id__in=AbContacts.objects.all().values_list('user_id', flat=True))

		if not_group is not None:
			queryset = queryset.exclude(groups__name='User').exclude(groups__name='user')

		queryset = self.filter_queryset(queryset)
		page = self.paginate_queryset(queryset)
		if page is not None and records is None:
			serializer = self.get_serializer(page, many=True)
			return self.get_paginated_response(serializer.data)
		serializer = self.get_serializer(queryset, many=True)

		#return apiCustomizedResponse(serializer.data)
		return Response(serializer.data)

	def perform_create(self, serializer):
		return serializer.save()
	#
	# def create(self, request):
	#     serializer = self.get_serializer(data=request.data)
	#     serializer.is_valid(raise_exception=True)
	#     user = self.perform_create(serializer)
	#     # user.password = make_password(request.data['password'])
	#     user.set_password(request.data['password'])
	#     user.save()
	#     post_data = request.data['groups']
	#     user.groups.add(post_data)
	#     return Response(serializer.data)

	def retrieve(self, request: Request, *args, **kwargs):
		if kwargs.get('pk') == 'me':
			response_data = self.get_serializer(request.user).data
			response_data['permissions'] = Permission.objects.filter(id__in=request.user.user_permissions.values_list('id', flat=True)).values_list('codename', flat=True)
			response_data['group_permissions'] = request.user.groups.first().permissions.all().values_list('codename', flat=True)
			response_data['group_name'] = request.user.groups.first().name
			if request.user.contact.exists():
				response_data['media'] = AbMedias.get_media(request.user.contact.first(), 'App\\Contact')
			else:
				response_data['media'] = None
			return Response(response_data)

		instance = self.get_object()
		serializer = self.get_serializer(instance)
		return Response(serializer.data)

	# call in case of patch method
	def partial_update(self, request, pk=None):
		updated_instance = super(UserViewSet, self).partial_update(request, pk)
		user = self.get_object()
		AbAircrafts.objects.filter(user_id=user.id).update(is_active_by_user=user.is_active)
		AbApus.objects.filter(user_id=user.id).update(is_active_by_user=user.is_active)
		AbEngines.objects.filter(user_id=user.id).update(is_active_by_user=user.is_active)
		AbParts.objects.filter(user_id=user.id).update(is_active=user.is_active)
		AbWanteds.objects.filter(user_id=user.id).update(is_active=user.is_active)
		return updated_instance

	# here we need to delete related contacts also
	# def destroy(self, request, *args, **kwargs):
	#     try:
	#         user = self.get_object()
	#         user.creator.all().delete()
	#     except Http404:
	#         pass
	#     return super(UserViewSet, self).destroy(request, *args, **kwargs)

	def destroy(self, request, *args, **kwargs):
		resp = safe_delete(self, request, AbUsers)
		return resp

	@action(detail=False, methods=['GET'], name='plan_details')
	def plan(self, request, *args, **kwargs):
		from datetime import timedelta
		from django.utils import timezone
		print('Logging........', flush=True)
		type = request.query_params.get('type')
		product = getPlanNameAndType(request.user)
		plan = None
		countData = 0
		if product['plan'] is not None:
			model = globals()[type]
			plan = model_to_dict(product['plan'])
			eligableDate = countData = None
			if request.user.trans_date is not None:
				diff =  request.user.trans_date - timezone.now()
				if product['type'] == 'monthly':
					eligableDate = request.user.trans_date + timedelta(days=30)
					if diff.days <= 31:
						countData = model.objects.filter(user=request.user, is_featured=1, promotion_date__gte=request.user.trans_date, promotion_date__lte=eligableDate).count()

				elif product['type'] == 'yearly':
					eligableDate = request.user.trans_date + timedelta(days=365)
					if diff.days <= 365:
						countData = model.objects.filter(user=request.user, is_featured=1, promotion_date__gte=request.user.trans_date, promotion_date__lte=eligableDate).count()

			print(product['plan'])
			if product['plan'].id == 2:
				credits = request.user.abcredits_set.filter(plan=product['plan'], is_active=1).order_by('-id')[:3]
				print(credits)
		return Response({'plan':plan, 'countData':countData}, status=HTTP_200_OK)

	@csrf_exempt
	@action(detail=False, methods=['POST'], name='payment_return')
	def promote(self, request, *args, **kwargs):
		print(request.query_params)
		return Response({}, status=HTTP_200_OK)

@csrf_exempt
@api_view(["POST"])
@permission_classes((AllowAny,))
@authentication_classes([])
def verify_email(request):
	token = request.data.get('token', None)
	if token is not None:
		user = AbUsers.objects.filter(email_verified=token).first()

		print('user', user)
		if user is not None:
			print('inside')

			user.email_verified = None
			user.is_active = 1
			# userpublished = user.contact.is_published
			# print("userpublished", userpublished)
			# user.contact.is_published = 1
			user.save()

			email_template = AbCannedemails.objects.get(message_type='user-activation')
			
			subject = email_template.subject
			footer_message = email_template.footer_message
			year = datetime.datetime.now()
			user_contact = user.contact.first()
			url = '{}/login'.format(settings.SITE_URL)
			context = {
						'name': "{} {}".format(user_contact.first_name, user_contact.last_name),
						'link':url,
					}
			context = {'email_content': Template(mark_safe(email_template.message)).render(Context(context)),
					   "year":year,
					   'footer_message': Template(mark_safe(footer_message)).render(Context({'asset':footer_message}))}
			html_content = get_template('email/canned/general.html').render(context)

			send_emails(subject, html_content, [user.email], email_template.sending_email)
			
			return Response({"data":"Your email has been verified", "success": True}, status=HTTP_200_OK)

	return Response({"data":"Access denied", "success": False}, status=HTTP_401_UNAUTHORIZED)

@csrf_exempt
@api_view(["POST"])
@permission_classes((AllowAny,))
@authentication_classes([])
def check_email(request):
	email = request.data.get('email', None)
	if email is not None:
		user = AbUsers.objects.filter(email=email).first()
		if user is not None:
			return Response({"data": "User with this email already exist", "success": False}, status=HTTP_401_UNAUTHORIZED)
	return Response({ "success": True}, status=HTTP_200_OK)

# ---------groups views --------------#
class GroupsViewSet(CommonViewset, generics.RetrieveAPIView):

	queryset = Group.objects.order_by('name')
	serializer_class = GroupSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	ordering_fields = ('id','name')
	filter_fields = ('id',)
	search_fields = ('id','name')

	def list(self, request, *args, **kwargs):
		records = request.GET.get('records', None)
		queryset = self.filter_queryset(self.get_queryset())
		page = self.paginate_queryset(queryset)
		if page is not None and records is None:
			serializer = self.get_serializer(page, many=True)
			return self.get_paginated_response(serializer.data)
		serializer = self.get_serializer(queryset, many=True)

		#return apiCustomizedResponse(serializer.data)
		return Response(serializer.data)

	def perform_create(self, serializer):
		return serializer.save()

	def create(self, request):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		group = self.perform_create(serializer)
		group.save()
		headers = self.get_success_headers(serializer.data)
		return Response(serializer.data)

	def retrieve(self, request, *args, **kwargs):
		instance = self.get_object()
		serializer = self.get_serializer(instance)
		data = serializer.data
		# here you can manipulate your data response
		return Response(serializer.data)

	def destroy(self, request, *args, **kwargs):
		resp = safe_delete(self, request, Group)
		return resp


# ---------groups views --------------#
class PermissionsViewSet(viewsets.ModelViewSet, generics.RetrieveAPIView):

	queryset = Permission.objects.all()
	serializer_class = PermissionSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	ordering_fields = ('id','name',)
	filter_fields = ('id',)
	search_fields = ('id','name',)

	def list(self, request, *args, **kwargs):
		queryset = self.filter_queryset(self.get_queryset())
		page = self.paginate_queryset(queryset)
		if page is not None:
			serializer = self.get_serializer(page, many=True)
			return self.get_paginated_response(serializer.data)
		serializer = self.get_serializer(queryset, many=True)

		#return apiCustomizedResponse(serializer.data)
		return Response(serializer.data)

	def perform_create(self, serializer):
		return serializer.save()

	def create(self, request):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		group = self.perform_create(serializer)
		group.save()
		headers = self.get_success_headers(serializer.data)
		return Response(serializer.data)

	def retrieve(self, request, *args, **kwargs):
		instance = self.get_object()
		serializer = self.get_serializer(instance)
		data = serializer.data
		# here you can manipulate your data response
		return Response(serializer.data)

	def destroy(self, request, *args, **kwargs):
		request_data = json.loads(request.body.decode('utf-8'))
		if 'ids' in request_data:
			Permission.objects.filter(id__in=request_data['ids']).delete()
			return Response(status=HTTP_204_NO_CONTENT)
		else:
			return super(PermissionsViewSet, self).destroy(request, *args, **kwargs)


# ---------  Manufacturers  views --------------#
class ManufacturersViewSet(CommonViewset, generics.RetrieveAPIView):

	queryset = AbManufacturers.objects.filter(deleted_at=None)
	serializer_class = ManufacturersSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	ordering_fields = ('id','name','categories__name')
	filter_fields = ('id','type','is_active')
	search_fields = ('id','name')

	def list(self, request, *args, **kwargs):
		records = request.GET.get('records', None)
		category_id = request.GET.get('category_id', None)
		queryset = self.filter_queryset(self.get_queryset())
		if category_id is not None:
			queryset = queryset.filter(categories__id = category_id)
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
		data['media'] = AbMedias.get_media(instance, 'App\\Manufacturer')
		return Response(data)

	def destroy(self, request, *args, **kwargs):
		resp = safe_delete(self, request, AbManufacturers)
		return resp


###################  Types View Set  ############

class TypesViewSet(CommonViewset, generics.RetrieveAPIView):

	queryset = AbTypes.objects.filter(deleted_at=None)
	serializer_class = TypesSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	ordering_fields = ('id','name','manufacturer__name')
	filter_fields = ('id','name', 'type','is_active', 'manufacturer_id')
	search_fields = ('id','name', 'manufacturer__name')

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
		data['media'] = AbMedias.get_media(instance, 'App\\Type')
		return Response(data)

	def destroy(self, request, *args, **kwargs):
		resp = safe_delete(self, request, AbTypes)
		return resp

# ---------Modals  views --------------#
class ModalsViewSet(CommonViewset, generics.RetrieveAPIView):

	queryset = AbModels.objects.filter(deleted_at=None)
	serializer_class = ModalsSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	ordering_fields = ('id', 'name','type_0__name')
	filter_fields = ('id','name','is_active','type', 'type_0')
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
		data = serializer.data
		data['media'] = AbMedias.get_media(instance, 'App\\Modeled')
		return Response(data)

	def destroy(self, request, *args, **kwargs):
		resp = safe_delete(self, request, AbModels)
		return resp
# ---------  Logentry  views --------------#
# class LogEntryViewSet(viewsets.ModelViewSet, generics.RetrieveAPIView):
# 	queryset = LogEntry.objects.filter(deleted_at=None)
# 	serializer_class = LogEntrySerializer
# 	filter_backends = (filters.OrderingFilter,filters.SearchFilter,DjangoFilterBackend,)
# 	ordering_fields = ('id','name')
# 	filter_fields = ('id','name')
# 	search_fields = ('id','name')

# 	def list(self, request, *args, **kwargs):
# 		queryset = self.filter_queryset(self.get_queryset())
# 		page = self.paginate_queryset(queryset)
# 		if page is not None:
# 			serializer = self.get_serializer(page, many=True)
# 			return self.get_paginated_response(serializer.data)
# 		serializer = self.get_serializer(queryset, many=True)
# 		return Response(serializer.data)

class ContentTypeViewSet(CommonViewset, generics.RetrieveAPIView):
	# exclude permisssion to be shown on frontend
	queryset = ContentType.objects.exclude(app_label__in=['admin', 'contenttypes', 'sessions', 'auth', 'authtoken', 'auditlog'])
	serializer_class = ContentTypeSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	search_fields = ('model',)
	filter_fields = ('model',)

class SubscriberViewSet(CommonViewset, generics.RetrieveAPIView):
	# exclude permisssion to be shown on frontend
	queryset = AbSubscribers.objects.filter(deleted_at=None)
	serializer_class = SubscriberSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	ordering_fields = ('id', 'name','email')
	filter_fields = ('id','is_active',)
	search_fields = ('id', 'name','email')
	def destroy(self, request, *args, **kwargs):
		resp = safe_delete(self, request, AbSubscribers)
		return resp


# ---------  Titles  views --------------#
class TitlesViewSet(CommonViewset, generics.RetrieveAPIView):

	queryset = AbTitles.objects.filter(deleted_at=None)
	serializer_class = TitlesSerializer
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

	def retrieve(self, request: Request, *args, **kwargs):
		instance = self.get_object()
		serializer = self.get_serializer(instance)
		return Response(serializer.data)

	def destroy(self, request, *args, **kwargs):
		resp = safe_delete(self, request, AbTitles)
		return resp

	@action(detail=False, methods=['GET'], name='related_jobs')
	def related_jobs(self, request, *args, **kwargs):
		job = AbTitles.objects.get(id=kwargs['pk']) 
		related_jobs = AbTitles.objects.filter(is_active=job.is_active).exclude(id=apjob.id)[0:4]
		serializer = self.get_serializer(related_jobs, many=True)
		return Response(serializer.data, status=HTTP_200_OK)


class AccesslogsViewSet(CommonViewset, generics.RetrieveAPIView):

	queryset = AbAccesslogs.objects.filter(deleted_at=None)
	serializer_class = AccesslogsSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	ordering_fields = ('id',)
	filter_fields = ('id',)
	search_fields = ('id',)

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
		resp = safe_delete(self, request, AbAccesslogs)
		return resp

	# def destroy(self, request, *args, **kwargs):
	#     request_data = json.loads(request.body.decode('utf-8'))
	#     if 'ids' in request_data:
	#         AbAccesslogs.objects.filter(id__in=request_data['ids']).delete()
	#         return Response(status=HTTP_204_NO_CONTENT)
	#     else:
	#         return super(AccesslogsViewSet, self).destroy(request, *args, **kwargs)




# ---------  Titles  views --------------#
class SuggestionViewSet(CommonViewset, generics.RetrieveAPIView):

	queryset = AbSuggestions.objects.filter(deleted_at=None)
	serializer_class = SuggestionsSerializer
	filter_backends = (filters.OrderingFilter,filters.SearchFilter,)
	ordering_fields = ('id',)
	filter_fields = ('id',)
	search_fields = ('id',)

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
		resp = safe_delete(self, request, AbSuggestions)
		return resp

@api_view(['GET'])
def api_root(request, format=None):
	return Response({
		'users': reverse('users', request=request, format=format),
	})

@csrf_exempt
@api_view(["POST"])
@permission_classes((AllowAny,))
@authentication_classes([])
def login(request):
	email = request.data.get("email")
	password = request.data.get("password")
	if email is None or password is None:
		return Response({'error': 'Please provide both email and password'},
						status=HTTP_400_BAD_REQUEST)
	user = authenticate(email=email, password=password)
	if not user:
		try:
			user = AbUsers.objects.get(email=email)
			if user.is_active != 1:
				return Response({'error': 'Please confirm your email to activate account'},
							status=HTTP_404_NOT_FOUND)
		except:
			pass

		return Response({'error': 'Invalid Credentials'},
						status=HTTP_404_NOT_FOUND)

		


	# create access logs entry
	AbAccesslogs(user=user, payload=json.dumps(makeRequestDict(request.META))).save()

	token, _ = Token.objects.get_or_create(user=user)
	return Response({'token': token.key},
					status=HTTP_200_OK)

@api_view(["POST"])
def logout(request):
	request.user.auth_token.delete()
	return Response(status=HTTP_200_OK)


@api_view(["POST"])
@permission_classes((AllowAny,))
@authentication_classes([])
def validateToken(request):
	token = request.data.get('token', None)
	if token is not None:
		if Token.objects.filter(key=token).exists():
			return Response(status=HTTP_200_OK)

	return Response(status=HTTP_401_UNAUTHORIZED)		

@csrf_exempt
@api_view(["POST"])
@permission_classes((AllowAny,))
@authentication_classes([])
def forgot_password(request):
	email = request.data.get("email")
	user = AbUsers.objects.filter(email=email)
	if user.exists():
		user = user.first()
		# send forgot password email
		random_id = id_generator(64)
		user.password_link = random_id
		user.save()

		if isRoleUser(user):
			reset_link = '{}/auth/reset-password/{}'.format(settings.SITE_URL, random_id)
		else:
			reset_link = '{}/admin/auth/reset-password/{}'.format(settings.SITE_URL, random_id)

		#print(reset_link)
		year = datetime.datetime.now().year
		email_template = AbCannedemails.objects.get(message_type='user-activation')
		footer_message = Template(mark_safe(email_template.footer_message)).render(Context({'asset': email_template.footer_message}))
		html_content = get_template('email/user/reset_password.html').render({'reset_link':reset_link, 'footer_message':footer_message, 'year':year})
		res = send_emails('Reset your password', html_content, [email])
		return Response({'message': 'Email has been send', 'success':True},
						status=HTTP_200_OK)
	else:
		return Response({'message': 'Email not exists', 'success':False},
						status=HTTP_404_NOT_FOUND)


@csrf_exempt
@api_view(["POST"])
@permission_classes((AllowAny,))
@authentication_classes([])
def reset_password(request):
	email = request.data.get("email")
	password = request.data.get("password")
	password_link = request.data.get("password_link")
	user = AbUsers.objects.filter(email=email, password_link=password_link)
	if user.exists():
		user = user.first()
		# send forgot password email
		user.password_link = None
		user.set_password(password)
		user.save()
		return Response({'message': 'Password has been updated successfully', 'success':True},
						status=HTTP_200_OK)
	else:
		return Response({'message': 'You are not authorized to access', 'success':False},
						status=HTTP_404_NOT_FOUND)

@api_view(["POST"])
def change_password(request):
	from django.contrib.auth.hashers import check_password
	currentpassword = request.user.password  # user's current password
	user_obj = AbUsers.objects.get(pk=request.user.id)

	current_password = request.data.get("current_password")
	new_password = request.data.get("newest_password")
	if not currentpassword.startswith('bcrypt$'):
		currentpassword = 'bcrypt${}'.format(currentpassword);

	if current_password is None or new_password is None:
		return Response({'error': 'Please provide both current and new password'},
						status=HTTP_400_BAD_REQUEST)
	matchcheck = check_password(current_password, currentpassword)
	if matchcheck:
		user_obj.set_password(new_password)
		user_obj.save()
	else:
		return Response({'error': 'Current password is not correct.'},
						status=HTTP_400_BAD_REQUEST)

	return Response(status=HTTP_200_OK)

@csrf_exempt
@api_view(["GET"])
def sample_api(request):
	data = {'sample_data': 123}
	return Response(data, status=HTTP_200_OK)

def admin_panel(request):
	return render(request, 'admin/build/index.html')

def user_panel(request):
	return render(request, 'user/build/index.html')

def guest_panel(request):
	return render(request, 'guest/out/index.html')


@api_view(['GET'])
def user_dashboard(request):
	from datetime import date, timedelta
	from django.db.models import Q
	user_id = request.user.id
	aircraftActive = AbAircrafts.objects.filter(user=user_id,isactivestatus='Approved',is_active_by_user=1,deleted_at=None).count()
	aircraftInactive = AbAircrafts.objects.filter(~Q(isactivestatus='Approved'),user=user_id,deleted_at=None).count()
	engineActive = AbEngines.objects.filter(user=user_id,isactivestatus='Approved',is_active_by_user=1,deleted_at=None).count()
	engineInactive = AbEngines.objects.filter(~Q(isactivestatus='Approved'),user=user_id,deleted_at=None).count()
	apuActive = AbApus.objects.filter(user=user_id,isactivestatus='Approved',is_active_by_user=1,deleted_at=None).count()
	apuInactive = AbApus.objects.filter(~Q(isactivestatus='Approved'),user=user_id,deleted_at=None).count()
	wantedActive = AbWanteds.objects.filter(user=user_id,is_active=1,deleted_at=None).count()
	wantedInactive = AbWanteds.objects.filter(user=user_id,is_active=0,deleted_at=None).count()

	aircraftLeads = AbLeads.objects.filter(user=user_id,leadable_type='App\\Aircraft',is_active=1,deleted_at=None).count()
	engineLeads = AbLeads.objects.filter(user=user_id,leadable_type='App\\Engine',is_active=1,deleted_at=None).count()
	apuLeads = AbLeads.objects.filter(user=user_id,leadable_type='App\\Apu',is_active=1,deleted_at=None).count()
	wantedLeads = AbLeads.objects.filter(user=user_id,leadable_type='App\\Wanted',is_active=1,deleted_at=None).count()

	today = datetime.datetime.now()
	subDays = (today - timedelta(days=30)).isoformat()

	aircrafts = AbAircrafts.objects.filter(user=user_id,deleted_at=None)
	airIds = []
	for data in aircrafts:
		airIds.append(data.id)
	airViewsData = AbViews.objects.filter(viewable_id__in=airIds,viewable_type='Aircraft',created_at__gt=subDays).count()

	engines = AbEngines.objects.filter(user=user_id,deleted_at=None)
	engIds = []
	for data in engines:
		engIds.append(data.id)
	engViewsData = AbViews.objects.filter(viewable_id__in=engIds,viewable_type='Engine',created_at__gt=subDays).count()

	apus = AbApus.objects.filter(user=user_id,deleted_at=None)
	apusIds = []
	for data in apus:
		apusIds.append(data.id)
	apusViewsData = AbViews.objects.filter(viewable_id__in=apusIds,viewable_type='Apu',created_at__gt=subDays).count()

	wanteds = AbWanteds.objects.filter(user=user_id,deleted_at=None)
	wantedsIds = []
	for data in wanteds:
		wantedsIds.append(data.id)
	wantedViewsData = AbViews.objects.filter(viewable_id__in=wantedsIds,viewable_type='Wanted',created_at__gt=subDays).count()

	content = {
		'aircraftActive': aircraftActive,
		'aircraftInactive': aircraftInactive,
		'engineActive': engineActive,
		'engineInactive': engineInactive,
		'apuActive': apuActive,
		'apuInactive': apuInactive,
		'wantedActive': wantedActive,
		'wantedInactive': wantedInactive,
		'chartData': {
			'aircraftLeads':aircraftLeads,
			'engineLeads':engineLeads,
			'apuLeads':apuLeads,
			'wantedLeads':wantedLeads
		},
		'airViewsData': airViewsData,
		'engViewsData': engViewsData,
		'apuViewsData': apusViewsData,
		'wantedViewsData': wantedViewsData,
	}
	return Response(content)


@api_view(['GET'])
def admin_dashboard(request):
	from datetime import date, timedelta

	from django.db.models import Q
	from info.models import AbViews

	today = datetime.datetime.now()
	user_id = request.user.id # remove it
	last_year = today.year - 1
	allUser = AbUsers.objects.filter(created_at__year=today.year)
	eligableDate = (date.today() - timedelta(days=31)).isoformat()
	eligableDateYearly = (date.today() - timedelta(days=365)).isoformat()

	personalPlanMonthly = AbUsers.objects.filter(order_id=101,trans_date__gt=eligableDate).count()
	personalPlanYearly = AbUsers.objects.filter(order_id=102,trans_date__gt=eligableDateYearly).count()
	corporatePlanMonthly = AbUsers.objects.filter(order_id=201,trans_date__gt=eligableDate).count()
	corporatePlanYearly = AbUsers.objects.filter(order_id=201,trans_date__gt=eligableDateYearly).count()

	freePlan = allUser.count() - personalPlanMonthly - personalPlanYearly - corporatePlanMonthly - corporatePlanYearly

	recentAirbookers = UsersSerializer(AbUsers.objects.order_by('-id')[:10], many = True).data

	# thisMonth = datetime.date(today.year + int(today.month/12),today.month%12+1, 1)-datetime.timedelta(days=1)
	# lastTwelveMonthDate = (thisMonth - timedelta(days=365)).isoformat()
	#
	# from django.db.models import Count
	# from django.db.models.functions import TruncMonth , ExtractMonth
	# from django.conf import settings
	# settings.USE_TZ = False
	# lineChartData = AbUsers.objects.annotate(month=ExtractMonth('created_at')).values('month').annotate(users=Count('id')).filter(created_at__range=(lastTwelveMonthDate, thisMonth))

	thisMonth = datetime.date(today.year, 1 % 12, 1)
	lastTwelveMonthDate = (thisMonth + timedelta(days=365)).isoformat()

	from django.db.models import Count
	from django.db.models.functions import TruncMonth, ExtractMonth
	settings.USE_TZ = False
	userYearlyData = AbUsers.objects.annotate(month=ExtractMonth('created_at')).values('month').annotate(count=Count('id')).order_by('month').filter(created_at__range=(thisMonth, lastTwelveMonthDate))
	companyYearlyData = AbCompanies.objects.annotate(month=ExtractMonth('created_at')).values('month').annotate(count=Count('id')).order_by('month').filter(created_at__range=(thisMonth, lastTwelveMonthDate))
	contactsYearlyData = AbContacts.objects.annotate(month=ExtractMonth('created_at')).values('month').annotate(count=Count('id')).order_by('month').filter(created_at__range=(thisMonth, lastTwelveMonthDate))
	aircraftsYearlyData = AbAircrafts.objects.annotate(month=ExtractMonth('created_at')).values('month').annotate(count=Count('id')).order_by('month').filter(created_at__range=(thisMonth, lastTwelveMonthDate))
	enginesYearlyData = AbEngines.objects.annotate(month=ExtractMonth('created_at')).values('month').annotate(count=Count('id')).order_by('month').filter(created_at__range=(thisMonth, lastTwelveMonthDate))
	apusYearlyData = AbApus.objects.annotate(month=ExtractMonth('created_at')).values('month').annotate(count=Count('id')).order_by('month').filter(created_at__range=(thisMonth, lastTwelveMonthDate))
	wantedYearlyData = AbWanteds.objects.annotate(month=ExtractMonth('created_at')).values('month').annotate(count=Count('id')).order_by('month').filter(created_at__range=(thisMonth, lastTwelveMonthDate))
	partsYearlyData = AbParts.objects.annotate(month=ExtractMonth('created_at')).values('month').annotate(count=Count('id')).order_by('month').filter(created_at__range=(thisMonth, lastTwelveMonthDate))
	airportsYearlyData = AbAirports.objects.annotate(month=ExtractMonth('created_at')).values('month').annotate(count=Count('id')).order_by('month').filter(created_at__range=(thisMonth, lastTwelveMonthDate))
	eventsYearlyData = AbEvents.objects.annotate(month=ExtractMonth('created_at')).values('month').annotate(count=Count('id')).order_by('month').filter(created_at__range=(thisMonth, lastTwelveMonthDate))
	newsYearlyData = AbNews.objects.annotate(month=ExtractMonth('created_at')).values('month').annotate(count=Count('id')).order_by('month').filter(created_at__range=(thisMonth, lastTwelveMonthDate))

	activeUser = AbUsers.objects.filter(is_active=1).count()
	inActiveUser = AbUsers.objects.filter(is_active=0).count()
	activeCompany = AbCompanies.objects.filter(is_active=1).count()
	inActiveCompany = AbCompanies.objects.filter(is_active=0).count()
	activeContact = AbContacts.objects.filter(is_published=1).count()
	inActiveContact = AbContacts.objects.filter(is_published=0).count()
	activeAircraft = AbAircrafts.objects.filter(isactivestatus='Approved',is_active_by_user=1).count()
	inActiveAircraft = AbAircrafts.objects.filter(~Q(isactivestatus='Approved')| Q(is_active_by_user=0)).count()
	activeEngine = AbEngines.objects.filter(isactivestatus='Approved',is_active_by_user=1).count()
	inActiveEngine = AbEngines.objects.filter(~Q(isactivestatus='Approved') | Q(is_active_by_user=0)).count()

	activeApu = AbApus.objects.filter(isactivestatus='Approved',is_active_by_user=1).count()
	inActiveApu = AbApus.objects.filter(~Q(isactivestatus='Approved') | Q(is_active_by_user=0)).count()

	activeWanted = AbWanteds.objects.filter(is_active=1).count()
	inActiveWanted = AbWanteds.objects.filter(is_active=0).count()

	activePart = AbParts.objects.filter(is_active=1).count()
	inActivePart = AbParts.objects.filter(is_active=0).count()
	activeAirport = AbAirports.objects.filter(is_active=1).count()
	inActiveAirport = AbAirports.objects.filter(is_active=0).count()
	activeNews = AbNews.objects.filter(is_active=1).count()
	inActiveNews = AbNews.objects.filter(is_active=0).count()
	activeEvent = AbEvents.objects.filter( is_active=1,end_date__range=[datetime.date(today.year,today.month,today.day), "2080-01-31"]).count()
	inActiveEvent = AbEvents.objects.filter( is_active=0,end_date__range=[datetime.date(today.year,today.month,today.day), "2080-01-31"]).count()

	content = {
		'pieChartData': {
			'freePlan': freePlan,
			'personalPlan': personalPlanMonthly + personalPlanYearly,
			'corporatePlan': corporatePlanMonthly + corporatePlanYearly
		},
		'recentAirbookers': recentAirbookers,
		'userYearlyData':userYearlyData,
		'activeUser':activeUser,
		'inActiveUser':inActiveUser,
		'companyYearlyData': companyYearlyData,
		'activeCompany':activeCompany,
		'inActiveCompany':inActiveCompany,
		'contactsYearlyData': contactsYearlyData,
		'activeContact':activeContact,
		'inActiveContact':inActiveContact,
		'aircraftsYearlyData': aircraftsYearlyData,
		'activeAircraft':activeAircraft,
		'inActiveAircraft':inActiveAircraft,
		'enginesYearlyData': enginesYearlyData,
		'activeEngine':activeEngine,
		'inActiveEngine':inActiveEngine,
		'apusYearlyData': apusYearlyData,
		'activeApu':activeApu,
		'inActiveApu':inActiveApu,
		'wantedYearlyData': wantedYearlyData,
		'activeWanted':activeWanted,
		'inActiveWanted':inActiveWanted,
		'partsYearlyData': partsYearlyData,
		'activePart':activePart,
		'inActivePart':inActivePart,
		'activeTotalAsset':activeAircraft + activeEngine + activeApu,
		'inActiveTotalAsset':inActiveAircraft + inActiveEngine + inActiveApu,
		'airportsYearlyData': airportsYearlyData,
		'activeAirport': activeAirport,
		'inActiveAirport': inActiveAirport,
		'newsYearlyData': newsYearlyData,
		'activeNews': activeNews,
		'inActiveNews': inActiveNews,
		'eventsYearlyData': eventsYearlyData,
		'activeEvent': activeEvent,
		'inActiveEvent': inActiveEvent,
	}
	return Response(content)

@api_view(['POST'])
def import_data(request):
	data = request.data.get('data')
	model = request.data.get('model')

	# models direct fields
	import_data_structure = {
		'AbCategories': ['type', 'name', 'is_active', 'description'],
		'AbManufacturers': ['type', 'name', 'is_active', 'description', 'established'],
		'AbTypes': ['type', 'name', 'is_active', 'description'],
		'AbModels': ['type', 'name', 'is_active', 'description'],
		'AbCities': ['name', 'is_active'],
		'AbStates': ['name', 'is_active'],
		'AbConfigurations': ['name', 'is_active'],
		'AbAirports':['name','iata_code','icao_code', 'time_zone','latitude','longitude','sunrise','sunset','is_active','views'],
		'AbEvents': ['title','start_date','end_date','website','location','address','details','is_active','views'],
		'AbConditions': ['name', 'is_active'],
		'AbReleases': ['name', 'is_active'],
		'AbSubscribers': ['name', 'email', 'comments', 'is_active'],
		'AbParts':['title','part_number','alternate_part_number','quantity','unit_measure', 'price','description'],
		# 'AbCannedemails': ['message_type', 'subject', 'sending_email', 'message', 'location', 'is_active'],
		# 'AbAirfieldTypes': ['name', 'is_active'],
		# 'AbTitles': ['name', 'is_active'],
		# 'AbSpecialities': ['name', 'is_active'], #import error
		# 'AbContinents': ['name', 'is_active'],
		# 'AbConditions': ['name', 'is_active'],
		# 'AbRegions': ['name', 'continent', 'is_active'], # import error
		# 'AbReleases': ['name', 'is_active'],
		# 'AbSeos': ['model_id', 'model_type', 'method', 'title', 'description', 'is_active', 'url'],
		# 'AbCms': ['url', 'section', 'title', 'sub_title', 'custom_url', 'body', 'is_active'],
	}

	# model relational fields
	import_data_relations = {
		'AbCategories': {},
		'AbManufacturers': {
			'country' : {'model': 'AbCountries', 'field':'name', 'related_name':'country_id', 'additional_data':{}}
		},
		'AbTypes': {
			'manufacturer' : {'model': 'AbManufacturers', 'field':'name', 'related_name':'manufacturer_id', 'additional_data':{'type':'type'}}
		},
		'AbModels': {
			'_type' : {'model': 'AbTypes', 'field':'name', 'related_name':'type_0_id', 'additional_data':{'type':'type'}}
		},
		'AbConfigurations': {},
		'AbCities': {
			'state' : {'model': 'AbStates', 'field':'name', 'related_name':'state_id', 'additional_data':{}}
		},
		'AbStates': {
			'country' : {'model': 'AbCountries', 'field':'name', 'related_name':'country_id', 'additional_data':{}}
		},
		'AbAirports': {
			'country' : {'model': 'AbCountries', 'field':'name', 'related_name':'country_id', 'additional_data':{}},
			'state' : {'model': 'AbStates', 'field':'name', 'related_name':'state_id', 'additional_data':{}},
			'city' : {'model': 'AbCities', 'field':'name', 'related_name':'city_id', 'additional_data':{}},
			'airfield_type' : {'model': 'AbAirfieldTypes', 'field':'name', 'related_name':'airfield_type_id', 'additional_data':{}},
		},
		'AbEvents': {
			'continent' : {'model': 'AbContinents', 'field':'name', 'related_name':'continent_id', 'additional_data':{}},
			'region' : {'model': 'AbRegions', 'field':'name', 'related_name':'region_id', 'additional_data':{}},
			'country' : {'model': 'AbCountries', 'field':'name', 'related_name':'country_id', 'additional_data':{}},
			'state' : {'model': 'AbStates', 'field':'name', 'related_name':'state_id', 'additional_data':{}},
			'city' : {'model': 'AbCities', 'field':'name', 'related_name':'city_id', 'additional_data':{}},
		},
		'AbParts': {
			'owner' : {'model': 'AbCompanies', 'field':'name', 'related_name':'owner_id', 'fetchOnly':True, 'additional_data':{}},
			'seller' : {'model': 'AbCompanies', 'field':'name', 'related_name':'seller_id', 'fetchOnly':True, 'additional_data':{}},
			'condition' : {'model': 'AbConditions', 'field':'name', 'related_name':'condition_id', 'additional_data':{}},
			# 'primary_contact' : {'model': 'AbContacts', 'field':'first_name', 'related_name':'primary_contact', 'fetchOnly':True, 'additional_data':{}},
			'release' : {'model': 'AbReleases', 'field':'name', 'related_name':'release_id', 'additional_data':{}},
			'location' : {'model': 'AbCountries', 'field':'name', 'related_name':'location_id', 'additional_data':{}},
			'user' : {'model': 'AbUsers', 'field':'id', 'related_name':'user_id', 'default': request.user.id, 'additional_data':{}},
		},
		'AbConditions': {},
		'AbReleases': {},
		'AbSubscribers': {},
	}

	boolean_cols = ['is_active','views']
	integer_cols = ['quantity']
	# try:
	if model in import_data_structure:
		# list of columns that are allowed to import
		allowCols = import_data_structure[model]
		allowReladedCols = import_data_relations[model]

		if data:
			# csv columns input by user
			inputCols = data.pop(0)

			if model == 'AbParts':
				for i in range(len(inputCols)):
					inputCols[i] = inputCols[i].replace(' ', '_').lower()

			objects = []
			for row in data:
				obj = eval(model)()
				for index, col in enumerate(inputCols):

					if not validFieldValue(obj, col, row[index]):
						row[index] = 0
						# return Response({'success':False, 'message':'Value of column {} is not valid at row # {}'.format(col.title(), data.index(row)+2)})
					# check if column is allowed
					if col in allowCols:
						# need to set True or False for integers
						if col in boolean_cols:
							row[index] = True if int(row[index]) == 1 else False

						if col in integer_cols:
							try:
								row[index] = int(row[index])
							except:
								row[index] = 0

						setattr(obj, col, row[index])

					# lets check if cols belongs to related model than get id
					for relCol in allowReladedCols:
						finalRelatedColId = None
						related_model = globals()[allowReladedCols[relCol]['model']]

						if 'default' in allowReladedCols[relCol] and allowReladedCols[relCol]['default'] is not None:
							kwargs = {allowReladedCols[relCol]['field']: allowReladedCols[relCol]['default']}
						elif relCol in inputCols:
							# find column index and than value
							kwargs = {allowReladedCols[relCol]['field']: row[inputCols.index(relCol)]}

						# check for additional column data - like for manufacuture we need to save their type also so check that
						additional_data = allowReladedCols[relCol]['additional_data']
						if additional_data:
							for ad in additional_data:
								# check if input has data with this column name
								if additional_data[ad] in inputCols:
									# find column index and than value
									kwargs[ad] = row[inputCols.index(additional_data[ad])]
								else:
									# for static data
									kwargs[ad] = additional_data[ad]


						queryset = related_model.objects.filter(**kwargs)

						if model == 'AbParts':
							kwargs['is_active'] = 1

						# check if related item not exist than create new
						if not queryset.exists():
							if 'fetchOnly' not in allowReladedCols[relCol] and kwargs[allowReladedCols[relCol]['field']] != '' and kwargs[allowReladedCols[relCol]['field']] is not None:
								related_model(**kwargs).save()
								finalRelatedColId = queryset.first().id
						else:
							finalRelatedColId = queryset.first().id

						setattr(obj, allowReladedCols[relCol]['related_name'], finalRelatedColId)
				objects.append(obj)

			model = eval(model)
			model.objects.bulk_create(objects)

	return Response({'success':True, 'message':'Record has been imported suscessfully'})
	# except ValueError as e:
	#     print(e)
	#     return Response({'success':False, 'message':str(e)})
	# except Exception as e:
	#     print(e)
	#     return Response({'success':False, 'message':'Unknown error occured'})

@api_view(["POST"])
def update_status(request):
	if request.data.get('id') and request.data.get('model') and request.data.get('isactivestatus'):
		id = request.data.get('id')
		modelname = request.data.get('model')
		isactivestatus = request.data.get('isactivestatus')
		status_reason = request.data.get('status_reason','')
		listOfStatus = ['Pending Approval', 'Rejected']
		year = datetime.datetime.now()
		if modelname == 'AbAircrafts':
			instanc = AbAircrafts.objects.get(pk=id)
			url = '{}/user/aircraft/asset/{}'.format(settings.SITE_URL, id)
		elif modelname == 'AbApus':
			instanc = AbApus.objects.get(pk=id)
			url = '{}/user/apu/asset/{}'.format(settings.SITE_URL, id)
		elif modelname == 'AbEngines':
			instanc = AbEngines.objects.get(pk=id)
			url = '{}/user/engine/asset/{}'.format(settings.SITE_URL, id)
		user_email = instanc.user.email
		#user_email = 'arslanmehmood051@gmail.com'
		FullName = instanc.user.contact.first().first_name +' '+ instanc.user.contact.first().last_name if instanc.user.contact is not None else instanc.user.email

		instanc.isactivestatus = isactivestatus
		instanc.save()
		# email_content = AbCannedemails.objects.get(message_type='asset-status')
		# footer_message = Template(mark_safe(email_content.footer_message)).render(Context({'asset': email_content.footer_message}))
		if isactivestatus in listOfStatus:
			subject = 'Status of your asset has been updated'
			context = {'name': FullName, 'status': isactivestatus, 'url': url, 'rejected_reason':status_reason,'year':year}
			html_content = get_template('email/canned/asset_status.html').render(context)
			res = send_emails(subject, html_content, [user_email])
			if res:
				return Response(res, status=HTTP_200_OK)
			else:
				return Response(res, status=HTTP_404_NOT_FOUND)
		elif isactivestatus == 'Approved' or isactivestatus == 'Expired':
			if isactivestatus == 'Approved':
				email_content = AbCannedemails.objects.filter(message_type='asset-approved', is_active=1, deleted_at=None)
			else:
				email_content = AbCannedemails.objects.filter(message_type='asset-expired')
			if email_content.exists():
				email_content = email_content.first()
				subject = email_content.subject
				context = {
					'user': FullName, 
					'asset':mark_safe('<a href="{}">{}</a>'.format(url, instanc.title)),
				}
				context = {'email_content': Template(mark_safe(email_content.message)).render(Context(context))}
				context['footer_message'] = Template(mark_safe(email_content.footer_message)).render(Context({'asset': email_content.footer_message}))
				context['year'] = datetime.datetime.now().year
				html_content = get_template('email/canned/general.html').render(context)
				res = send_emails(subject, html_content, [user_email], email_content.sending_email)
				if res:
					return Response(res, status=HTTP_200_OK)
			else:
				return Response('Email template not found', status=HTTP_404_NOT_FOUND)
		else:                 # For Revise Status
			subject = 'Please revise your asset'
			context = {'name': FullName, 'content':status_reason,'url':url, 'year': year}
			html_content = get_template('email/user/assetRevise.html').render(context)
			res = send_emails(subject, html_content, [user_email])

			if res:
				return Response(res, status=HTTP_200_OK)
			else:
				return Response(res, status=HTTP_404_NOT_FOUND)
			instanc.status_reason = status_reason
			instanc.save()
	else:
		return Response('', status=HTTP_404_NOT_FOUND)


@api_view(["POST"])
def verification(request):
	# email_verified = request.data.get('email_verified')
	user = request.data.get('user')
	user.is_active = 0
	user.email_verified = None
	user.save()

	return user



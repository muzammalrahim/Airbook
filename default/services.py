from info.models import AbPlans
import requests, json, string, random
from django.conf import settings
from itertools import chain
from django.db.models import Q, Count, Sum
from connect.models import AbLikes
from info.models import AbViews
from datetime import datetime
from django.db.models.functions import ExtractYear, ExtractMonth
from item.models import AbAircrafts, AbEngines, AbApus, AbWanteds

import base64
import io
from PIL import Image


def decodeBase64Image(data):
    # try:
	data = base64.b64decode(data.encode('UTF-8'))
	buf = io.BytesIO(data)
	img = Image.open(buf)
	return img
    # except:
    #     return None

def getPlanNameAndType(user):
	plans = AbPlans.objects.all()
	plan = plan_type = None
	if user.order_id == '101':
		plan = plans[1]
		plan_type = 'monthly'

	elif user.order_id == '102':
		plan = plans[1]
		plan_type = 'yearly'

	elif user.order_id == '201':
		plan = plans[2]
		plan_type = 'monthly'

	elif user.order_id == '202':
		plan = plans[2]
		plan_type = 'yearly'

	return {'plan':plan, 'type': plan_type }


def makeRequestDict(obj):
	items = {}
	for k in obj:
		# control request attributes from here
		if k in ['REMOTE_ADDR','REQUEST_METHOD']:
			items[k] = obj[k]

	if 'HTTP_X_FORWARDED_FOR' in obj:
		obj["HTTP_X_PROXY_REMOTE_ADDR"] = obj["REMOTE_ADDR"]
		parts = obj["HTTP_X_FORWARDED_FOR"].split(",", 1)
		items["REMOTE_ADDR"] = parts[0]
	return items

def to_dict(instance):
	opts = instance._meta
	data = {}
	for f in chain(opts.concrete_fields, opts.private_fields):
		data[f.name] = f.value_from_object(instance)
	for f in opts.many_to_many:
		data[f.name] = [i.id for i in f.value_from_object(instance)]
	return data
	
def createPayTabPage(request, plan, order_id):
	user = request.user
	if not user:
		return {"success":False}

	user.order_id = order_id
	contact = user.contact.first()
	
	if order_id in ['102', '202']: # yearly subscription
		quantity = 12
	else:
		quantity = 1

	amount = quantity * plan.price

	requestMeta = makeRequestDict(request.META)

	data = {
		'merchant_email':'arslanmehmood051@gmail.com',
		'secret_key':'G5i3Gbq9dI4117OSLsnJeMshwuOK6VgM0yQGJgQXZUZ01NTMfgwu2YMztBkzwAmw8cdSt3QsXPtYDmLTChnFgafJLzjh9GNiT0bm',
		'currency':'USD',#change this to the required currency
		'amount':amount,#change this to the required amount
		'site_url':settings.SITE_URL,#change this to reflect your site
		'title':'Billing for purchasing plan '+plan.title,#Change this to reflect your order title
		'quantity':quantity,#Quantity of the product
		'unit_price':plan.price, #Quantity * price must be equal to amount
		'products_per_title':plan.title, #Change this to your products
		'return_url':'{}/paytab/callback'.format(settings.SITE_URL),#This should be your callback url
		'cc_first_name':contact.first_name if contact else '',#Customer First Name
		'cc_last_name':contact.last_name if contact else '',#Customer Last Name
		'cc_phone_number':'00971', #Country code
		'phone_number':contact.mobile_phone if contact and contact.mobile_phone else 'Not provided', #Customer Phone Minimum 6 numbers and Maximum 15
		'billing_address':contact.address if contact and contact.address else 'Not provided', #Billing Address max-legnth 40
		'city':contact.city.name if contact and contact.city else'Not provided',#Billing City max-legnth 50
		'state':contact.state.name if contact  and contact.state else 'Not provided',#Billing State
		'postal_code':'Not provided',#
		'country':'BHR',#Iso 3 country code
		'email':user.email,#Customer Email
		'ip_customer':requestMeta['REMOTE_ADDR'],#Pass customer IP here
		'ip_merchant':'127.0.0.1',#Change this to your server IP
		'address_shipping':contact.address if contact and contact.address else 'Not provided',#Shipping Address
		'city_shipping':contact.city.name if contact and contact.city else 'Not provided',#Shipping City
		'state_shipping':contact.state.name if contact and contact.state else 'Not provided',#Shipping State
		'postal_code_shipping':'973',
		'country_shipping':'BHR',
		'other_charges':0,#Other chargs can be here
		'reference_no':'Ref-{}-{}'.format(user.id, user.order_id),#Pass the order id on your system for your reference
		'msg_lang':'en',#The language for the response
		'cms_with_version':'Nodejs Lib v1',#Feel free to change this
	}
	try:
		response = json.loads(requests.post("https://www.paytabs.com/apiv2/create_pay_page", data).text)
		if response['response_code'] == '4012':
			return {"success":True, "payment_url":response['payment_url'], "p_id":response['p_id']}

		return {"success":False}
	except:
		return {"success":False}


def send_emails(subject,html_content,to, reply=None, rep_to=None):
	from django.core.mail import BadHeaderError, EmailMultiAlternatives
	# to = ['arslanmehmood051@gmail.com']
	if reply is None:
		reply = "no-reply@airbook.aero"
	reply = "Airbook <{}>".format(reply)
	msg = EmailMultiAlternatives(subject, '', reply, to, reply_to=rep_to)
	msg.attach_alternative(html_content, "text/html")
	try:
		 res = msg.send()
	except BadHeaderError:
		return res
	return res

def id_generator(size=6, chars=string.ascii_uppercase + string.digits):
	return ''.join(random.choice(chars) for _ in range(size))

def isRoleUser(obj):
	if obj and obj.groups.filter(Q(name='User') | Q(name='user')).exists():
		return True
	else:
		return False

def validFieldValue(obj, col, val):
	import decimal
	from django.core.exceptions import ObjectDoesNotExist
	try:
		if obj.__class__.__name__ == 'AbParts' and hasattr(obj, col):
			fieldType = obj._meta.get_field(col).get_internal_type()
			try:
				if fieldType == 'DecimalField':
					decimal.Decimal(val)
			except decimal.InvalidOperation:
				return False
	except ObjectDoesNotExist:
		return True
	return True

def like_and_favourite_by_id(modelId, model, lastTenMonthDate, thisMonth):
	model = 'App\\{}'.format(model)
	likes = AbLikes.objects.filter(
		likable_id=modelId, 
		likable_type=model, 
		created_at__range=(lastTenMonthDate, thisMonth)).annotate(
		month=ExtractMonth('created_at')).values('month').annotate(
		year=ExtractYear('created_at')).annotate(likes=Count('id')).order_by('month').order_by('year')
	

	views = AbViews.objects.filter(
		viewable_id=modelId, 
		viewable_type=model, 
		created_at__range=(lastTenMonthDate, thisMonth)).annotate(month=ExtractMonth('created_at')).values('month').annotate(
		year=ExtractYear('created_at')).annotate(views=Count('id')).order_by('month').order_by('year')
	
	return [views, likes]

def like_and_favourite_by_type(modelId, model, lastTenMonthDate, thisMonth):
	
	modelClass = globals()['Ab{}s'.format(model)]
	table_name = 'ab_{}s'.format(model.lower())

	modelObject = modelClass.objects.filter(id=modelId).first()
	if modelObject is not None:

		query = '''SELECT tb.id, count('l.id') as likes, MONTH(l.created_at) month, Year(l.created_at) year
                   FROM {} as tb
                   LEFT JOIN ab_likes as l
                   ON tb.id = l.likable_id and l.likable_type = "App\\\\{}"
                   WHERE (l.created_at BETWEEN "{}" AND "{}" )'''
		params = [table_name, model, datetime.strftime(lastTenMonthDate, '%Y-%m-%d'), datetime.strftime(thisMonth, '%Y-%m-%d')]
		if modelObject.type_id is not None :
				query += ' AND tb.type_id = {}'
				params.append(modelObject.type_id)
				
		if modelObject.manufacturer_id is not None :
				query += ' AND tb.manufacturer_id = {}'
				params.append(modelObject.manufacturer_id)
				
		if modelObject.model_id is not None :
				query += ' AND tb.model_id = {}'
				params.append(modelObject.model_id)
				
		query += ' GROUP by month ORDER by year, month'
	
		print('query', query)
		print('params', params)
		print('lastTenMonthDate', datetime.strftime(lastTenMonthDate, '%Y-%m-%d'))

		likesQueryset = modelClass.objects.raw(query.format(*params))

		likes = []
		for like in likesQueryset:
			if like.month != None:
				likes.append({'likes':like.likes, 'month':like.month, 'year':like.year})

		
		query = '''SELECT tb.id, count('v.id') as views, MONTH(v.created_at) month, Year(v.created_at) year
                   FROM {} as tb
                   LEFT JOIN ab_views as v
                   ON tb.id = v.viewable_id and v.viewable_type = "App\\\\{}"
                   WHERE (v.created_at BETWEEN "{}" AND "{}" )'''

		params = [table_name, model, datetime.strftime(lastTenMonthDate, '%Y-%m-%d'), datetime.strftime(thisMonth, '%Y-%m-%d')]

		if modelObject.type_id is not None :
				query += ' AND tb.type_id = {}'
				params.append(modelObject.type_id)
				
		if modelObject.manufacturer_id is not None :
				query += ' AND tb.manufacturer_id = {}'
				params.append(modelObject.manufacturer_id)
				
		if modelObject.model_id is not None :
				query += ' AND tb.model_id = {}'
				params.append(modelObject.model_id)
				
		query += ' GROUP by month ORDER by year, month'
	

		viewsQueryset = modelClass.objects.raw(query.format(*params))
		print('query', viewsQueryset.query)
		views = []
		for view in viewsQueryset:
			if view.month != None:
				views.append({'views':view.views, 'month':view.month, 'year':view.year})

		return [views, likes]
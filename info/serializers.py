from rest_framework import serializers, status
from info.models import AbGlobal, AbCategories,AbConfigurations,AbReleases, AbPricing, AbMedias,AbNews,AbCannedemails,AbCms, AbSeos,AbPaymentHistories,AbAdvertisements,AbPlans,AbPoints, AbAttaches,AbCustom,AbCredits
from connect.models import  AbContinents, AbRegions,AbCompanies,AbCountries, AbContacts, AbLikes, AbConnections, AbFavourites
from connect.serializers import Base64ImageField,ContinentsSerializer, RegionsSerializer, CompanySerializer, CountrySerializer
from rest_framework.validators import UniqueValidator
import base64, six, uuid
from item.models import AbAircrafts, AbEngines, AbApus, AbWanteds
from django.core.files.base import ContentFile
from django.conf import settings
from default.services import isRoleUser, to_dict
import json,io,PIL
from PIL import Image
from item.models import AbAircrafts, AbEngines, AbApus, AbWanteds, AbParts, AbAirports
from info import models

class CategorySerializer(serializers.ModelSerializer):
    file = Base64ImageField(max_length=None, use_url=True, required=False)
    id = serializers.IntegerField(read_only=True)
    # type = serializers.CharField(max_length=150)

    # add role base profile fields here
    def __init__(self, *args, **kwargs):
        super(CategorySerializer, self).__init__(*args, **kwargs)

    def create(self, validated_data):
        if 'file' in validated_data:
            file = validated_data.pop('file')
            category = AbCategories.objects.create(**validated_data)
            AbMedias(
                mediable_type='App\\Category',
                mediable_id=category.id,
                path='Category',
                original_file_name=file,
                is_active=1,
                accessibility=1,
                is_featured=0
            ).save()

        else:
            category = AbCategories.objects.create(**validated_data)

        return category

    def update(self, instance, validated_data):
        if 'file' in validated_data:
            file = validated_data.pop('file')

            # delete old one
            media = AbMedias.objects.filter(mediable_type='App\\Category',mediable_id=instance.id)
            if media.exists():
                media.first()._delete_file()
                media.first().delete()

            AbMedias(
                mediable_type='App\\Category',
                mediable_id=instance.id,
                path='Category',
                original_file_name=file,
                is_active=1,
                accessibility=1,
                is_featured=0
            ).save()
        else:
            media = AbMedias.objects.filter(mediable_type='App\\Category', mediable_id=instance.id)
            if media.exists():
                media.first()._delete_file()
                media.first().delete()

        instance.description = validated_data.get('description', instance.description)
        instance.name = validated_data.get('name', instance.name)
        instance.is_active = validated_data.get('is_active', instance.is_active)
        instance.save()
        return instance

    class Meta:
        model = AbCategories
        fields = ('id','name','type','file', 'is_active','description','created_at', 'updated_at')
        datatables_always_serialize = ('id','name','is_active')


class ConfigurationsSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(validators=[UniqueValidator(queryset=AbConfigurations.objects.all())], max_length=150)
    def __init__(self, *args, **kwargs):
        super(ConfigurationsSerializer, self).__init__(*args, **kwargs)

    class Meta:
        model = AbConfigurations
        fields = ('id', 'name', 'is_active','created_at', 'updated_at')
        datatables_always_serialize = ('id',)


#######################    AbReleases Serializer    Serializer  #################

class ReleasesSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(validators=[UniqueValidator(queryset=AbReleases.objects.all())], max_length=150)
    def __init__(self, *args, **kwargs):
        super(ReleasesSerializer, self).__init__(*args, **kwargs)

    class Meta:
        model = AbReleases
        fields = ('id','name','is_active','created_at','updated_at')
        datatables_always_serialize = ('id',)


class NewsSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    file = Base64ImageField(max_length=None, use_url=True, required=False)
    # title = serializers.CharField(validators=[UniqueValidator(queryset=AbNews.objects.all())], max_length=150)
    continent = serializers.PrimaryKeyRelatedField(write_only=True, queryset=AbContinents.objects.all())
    region = serializers.PrimaryKeyRelatedField(write_only=True, queryset=AbRegions.objects.all())
    country = serializers.PrimaryKeyRelatedField(write_only=True, queryset=AbCountries.objects.all())
    categories = serializers.PrimaryKeyRelatedField(many=True, write_only=True, queryset=AbCategories.objects.all())
    # company = serializers.PrimaryKeyRelatedField(write_only=True, queryset=AbCompanies.objects.all())
    def __init__(self, *args, **kwargs):
        super(NewsSerializer, self).__init__(*args, **kwargs)

    def create(self, validated_data):
        if 'file' in validated_data:
            file = validated_data.pop('file')
            news = super(NewsSerializer, self).create(validated_data)
            AbMedias(
                mediable_type='App\\News',
                mediable_id=news.id,
                path='News',
                original_file_name=file,
                is_active=1,
                accessibility=1,
                is_featured=0
            ).save()
        else:
            news = super(NewsSerializer, self).create(validated_data)
        return news

    def update(self, instance, validated_data):
        if 'file' in validated_data:
            file = validated_data.pop('file')
            media = AbMedias.objects.filter(mediable_type='App\\News', mediable_id=instance.id)
            if media.exists():
                media.first()._delete_file()
                media.first().delete()

            AbMedias(
                mediable_type='App\\News',
                mediable_id=instance.id,
                path='News',
                original_file_name=file,
                is_active=1,
                accessibility=1,
                is_featured=0
            ).save()
        else:
            media = AbMedias.objects.filter(mediable_type='App\\News', mediable_id=instance.id)
            if media.exists():
                media.first()._delete_file()
                media.first().delete()

        return super(NewsSerializer, self).update(instance, validated_data)

    def to_representation(self, instance):
        representation = super(NewsSerializer, self).to_representation(instance)
        representation['company'] = CompanySerializer(instance.company).data

        try:
            representation['company'] = CompanySerializer(instance.company).data
        except:
            representation['company'] = None
        return representation

    class Meta:
        model = AbNews
        fields = ('id','title','date','company','continent','region','categories','country','source','details','file','is_active','views',
                  'created_at','updated_at')
        datatables_always_serialize = ('id','title','date','is_active', 'company')


class EmailsSerializer(serializers.ModelSerializer):

   class Meta:
        model = AbCannedemails
        fields = ('id','subject','message_type','footer_message','sending_email','message','location','is_active','created_at','updated_at')
        datatables_always_serialize = ('id',)


class CmsSerializer(serializers.ModelSerializer):
    file = Base64ImageField(max_length=None, use_url=True, required=False)
   
    def __init__(self, *args, **kwargs):
        super(CmsSerializer, self).__init__(*args, **kwargs)

    def create(self, validated_data):
        if 'file' in validated_data:
            file = validated_data.pop('file')
            cms = super(CmsSerializer, self).create(validated_data)
            AbMedias(
                mediable_type='App\\Cms',
                mediable_id=cms.id,
                path='Cms',
                original_file_name=file,
                is_active=1,
                accessibility=1,
                is_featured=0
            ).save()
        else:
            cms = super(CmsSerializer, self).create(validated_data)
        return cms

    def update(self, instance, validated_data):
        if 'file' in validated_data:
            file = validated_data.pop('file')
            media = AbMedias.objects.filter(mediable_type='App\\Cms', mediable_id=instance.id)
            if media.exists():
                media.first()._delete_file()
                media.first().delete()

            AbMedias(
                mediable_type='App\\Cms',
                mediable_id=instance.id,
                path='Cms',
                original_file_name=file,
                is_active=1,
                accessibility=1,
                is_featured=0
            ).save()
        else:
            media = AbMedias.objects.filter(mediable_type='App\\Cms', mediable_id=instance.id)
            if media.exists():
                media.first()._delete_file()
                media.first().delete()

        return super(CmsSerializer, self).update(instance, validated_data) 
    class Meta:
        model = AbCms
        fields = ('id','url','section','title','sub_title','custom_url','body','file','is_active','created_at','updated_at')
        datatables_always_serialize = ('id',)


class SeoSerializer(serializers.ModelSerializer):
    file = Base64ImageField(max_length=None, use_url=True, required=False)
   
    def __init__(self, *args, **kwargs):
        super(SeoSerializer, self).__init__(*args, **kwargs)

    def create(self, validated_data):
        if 'file' in validated_data:
            file = validated_data.pop('file')
            seos = super(SeoSerializer, self).create(validated_data)
            AbMedias(
                mediable_type='App\\Seo',
                mediable_id=seos.id,
                path='Seo',
                original_file_name=file,
                is_active=1,
                accessibility=1,
                is_featured=0
            ).save()
        else:
            seos = super(SeoSerializer, self).create(validated_data)
        return seos

    def update(self, instance, validated_data):
        if 'file' in validated_data:
            file = validated_data.pop('file')
            media = AbMedias.objects.filter(mediable_type='App\\Seo', mediable_id=instance.id)
            if media.exists():
                media.first()._delete_file()
                media.first().delete()

            AbMedias(
                mediable_type='App\\Seo',
                mediable_id=instance.id,
                path='Seo',
                original_file_name=file,
                is_active=1,
                accessibility=1,
                is_featured=0
            ).save()
        else:
            media = AbMedias.objects.filter(mediable_type='App\\Seo', mediable_id=instance.id)
            if media.exists():
                media.first()._delete_file()
                media.first().delete()

        return super(SeoSerializer, self).update(instance, validated_data)

    def to_representation(self, instance):
        representation = super(SeoSerializer, self).to_representation(instance)
        frontend = self.context['request'].GET.get('frontend', None)
        if frontend is not None:
            # try:
            representation['media'] = AbMedias.getThumb(instance, 'App\\Seo', 0)
            # except:
            #     representation['media'] = None
        return representation
    class Meta:
        model = AbSeos
        fields = ('id','model_id','model_type','title','method','url','description','file','is_active','created_at','updated_at')
        datatables_always_serialize = ('id',)

class PaymenthistoriesSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    def __init__(self, *args, **kwargs):
        super(PaymenthistoriesSerializer, self).__init__(*args, **kwargs)

    def to_representation(self, instance):
        from account.serializers import UsersSerializer
        representation = super(PaymenthistoriesSerializer, self).to_representation(instance)
        try:
            representation['user'] = UsersSerializer(instance.user).data
        except:
            representation['user'] = None
        try:
            representation['credits'] = json.loads(instance.credits)
        except:
            representation['credits'] = None
        return representation

    class Meta:
        model = AbPaymentHistories
        fields = ('id','user','credits','transaction_id','order_id','response_code','response_message','customer_name',
                  'customer_email','transaction_amount','transaction_currency','customer_phone','first_4_digits',
                  'last_4_digits','card_brand','trans_date','pt_customer_email','pt_customer_password','pt_token',
                  'secure_sign','status','created_at','updated_at')
        lookup_field = 'transaction_id'
        datatables_always_serialize = ('id',)

class AdvertisementsSerializer(serializers.ModelSerializer):
    file = Base64ImageField(max_length=None, use_url=True, required=False)
    remove_file = serializers.BooleanField(default=False)
    dimensions = {
        "page-top":{"height":80, "width":200},
        "page-bottom":{"height":80, "width":200},
        "page-sidebar":{"height":385, "width":385},
    }
    def create(self, validated_data):
        if 'remove_file' in validated_data:
            validated_data.pop('remove_file')

        if 'file' in validated_data:
            file = validated_data.pop('file')
            width, height = Image.open(file).size

            if width != self.dimensions[validated_data['section']]['width'] or height != self.dimensions[validated_data['section']]['height']:
                raise serializers.ValidationError({'Image': ['Dimensions are not correct']})

            advertisements = super(AdvertisementsSerializer, self).create(validated_data)
            
            AbMedias(
                mediable_type='App\\Advertisements',
                mediable_id=advertisements.id,
                path='Advertisements',
                original_file_name=file,
                is_active=1,
                accessibility=1,
                is_featured=0
            ).save()
        else:
            advertisements = super(AdvertisementsSerializer, self).create(validated_data)
        return advertisements

    def update(self, instance, validated_data):
        if 'file' in validated_data:
            file = validated_data.pop('file')
            width, height = Image.open(file).size

            if width != self.dimensions[validated_data['section']]['width'] or height != self.dimensions[validated_data['section']]['height']:
                raise serializers.ValidationError({'Image': ['Dimensions are not correct']})

            media = AbMedias.objects.filter(mediable_type='App\\Advertisements', mediable_id=instance.id)
            if media.exists():
                media.first()._delete_file()
                media.first().delete()
            AbMedias(
                mediable_type='App\\Advertisements',
                mediable_id=instance.id,
                path='Advertisements',
                original_file_name=file,
                is_active=1,
                accessibility=1,
                is_featured=0
            ).save()
            
        if 'remove_file' in validated_data and validated_data['remove_file']:
            validated_data.pop('remove_file')
            media = AbMedias.objects.filter(mediable_type='App\\Advertisements', mediable_id=instance.id)
            if media.exists():
                media.first()._delete_file()
                media.first().delete()

        return super(AdvertisementsSerializer, self).update(instance, validated_data)

    def to_representation(self, instance):
        from account.serializers import UsersSerializer
        representation = super(AdvertisementsSerializer, self).to_representation(instance)
        try:
            representation['user'] = UsersSerializer(instance.user).data
        except:
            representation['user'] = None
        representation['media'] = AbMedias.get_media(instance, 'App\\Advertisements')
        return representation
    class Meta:
        model = AbAdvertisements
        fields = ('id','user','start_date','remove_file','end_date','section','url','file','is_active','created_at','updated_at')
        datatables_always_serialize = ('id','user')


class PointsSerializer(serializers.ModelSerializer):
    def __init__(self, *args, **kwargs):
        super(PointsSerializer, self).__init__(*args, **kwargs)

    def create(self, validated_data):
        points_data = validated_data.pop('points')
        points = AbPoints.objects.create(**validated_data)
        for point_data in points_data:
            AbPoints.objects.create(points=points, **point_data)
        return points
    class Meta:
        model = AbPoints
        fields = ('id','plan','points_type','number_points','point_text','sub_text','created_at','updated_at')
        datatables_always_serialize = ('id',)

class CustomSerializer(serializers.ModelSerializer):
    def __init__(self, *args, **kwargs):
        super(CustomSerializer, self).__init__(*args, **kwargs)
        # self.fields['plan'].required = False
    class Meta:
        model = AbCustom
        fields = ('id','label','value','main_heading','created_at','updated_at')
        datatables_always_serialize = ('id',)

class CreditsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AbCredits
        fields = ('id','user','plan','credits_type','value','is_active')
        datatables_always_serialize = ('id',)

class PlansSerializer(serializers.ModelSerializer):
    custom = CustomSerializer(many=True)
    file = Base64ImageField(max_length=None, use_url=True, required=False)

    def __init__(self, *args, **kwargs):
        super(PlansSerializer, self).__init__(*args, **kwargs)

    def create(self, validated_data):
        customs_datas = validated_data.pop('custom')
        file = None
        if 'file' in validated_data:
            file = validated_data.pop('file')
        plans = AbPlans.objects.create(**validated_data)
        for customs_data in customs_datas:
            AbCustom.objects.create(plan=plans, **customs_data)

        if file is not None:
            # plans = super(PlansSerializer, self).create(validated_data)
            AbMedias(
                mediable_type='App\\Plans',
                mediable_id=plans.id,
                path='Plans',
                original_file_name=file,
                is_active=1,
                accessibility=1,
                is_featured=0
            ).save()
        return plans

    def update(self, instance, validated_data):
        customs_data = validated_data.pop('custom')
        customs_dict = dict((i.id, i) for i in instance.custom.all())
        for custom in customs_data:
            if 'id' in custom:
                custom_obj = customs_dict.pop(custom['id'])
                custom_obj.label = custom.get('label', custom_obj.label)
                custom_obj.value = custom.get('value', custom_obj.value)
                custom_obj.save()
            else:
                AbCustom.objects.create(plan=instance, **custom)
                
        # delete remaining elements because they're not present in my update call
        if len(customs_dict) > 0:
            for custom in customs_dict.values():
                custom.delete()

        if 'file' in validated_data:
            file = validated_data.pop('file')
            media = AbMedias.objects.filter(mediable_type='App\\Plans', mediable_id=instance.id)
            if media.exists():
                media.first()._delete_file()
                media.first().delete()
            AbMedias(
                mediable_type='App\\Plans',
                mediable_id=instance.id,
                path='Plans',
                original_file_name=file,
                is_active=1,
                accessibility=1,
                is_featured=0
            ).save()
        instance.title = validated_data.get('title', instance.title)
        instance.sub_title = validated_data.get('sub_title', instance.sub_title)
        instance.price_label = validated_data.get('price_label', instance.price_label)
        instance.price = validated_data.get('price', instance.price)
        instance.discount = validated_data.get('discount', instance.discount)
        instance.button_label = validated_data.get('button_label', instance.button_label)
        instance.aircraft_label = validated_data.get('aircraft_label', instance.aircraft_label)
        instance.aircraft_value = validated_data.get('aircraft_value', instance.aircraft_value)
        instance.engine_label = validated_data.get('engine_label', instance.engine_label)
        instance.engine_value = validated_data.get('engine_value', instance.engine_value)
        instance.apu_label = validated_data.get('apu_label', instance.apu_label)
        instance.apu_value = validated_data.get('apu_value', instance.apu_value)
        instance.wanted_label = validated_data.get('wanted_label', instance.wanted_label)
        instance.wanted_value = validated_data.get('wanted_value', instance.wanted_value)
        instance.parts_label = validated_data.get('parts_label', instance.parts_label)
        instance.parts_value = validated_data.get('parts_value', instance.parts_value)
        instance.is_active = validated_data.get('is_active', instance.is_active)
        instance.save()
        return instance

    def to_representation(self, instance):
        representation = super(PlansSerializer, self).to_representation(instance)
        try:
            representation['media'] = AbMedias.get_media(instance, 'App\\Plans')
        except:
            representation['media'] = None
        try:
            if instance.id == 2:
                print(self.context['request'].user.abcredits_set)
                representation['credits'] = CreditsSerializer(self.context['request'].user.abcredits_set.filter(plan=instance, is_active=1).order_by('-id')[:3], many=True).data
        except:
            representation['credits'] = None
        return representation
    class Meta:
        model = AbPlans
        fields = ('id','title','sub_title','price_label','price','discount','button_label','aircraft_label','aircraft_value',
                    'engine_label','engine_value','apu_label','apu_value','wanted_label','wanted_value','parts_label','parts_value',
                    'custom','file','is_active','created_at','updated_at')
        datatables_always_serialize = ('id',)


class MediasSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    accessibility = serializers.IntegerField(required=False)
    original_file_name = serializers.ImageField(use_url=False)
    file = Base64ImageField(max_length=None, use_url=True, required=False)

    def __init__(self, *args, **kwargs):
        super(MediasSerializer, self).__init__(*args, **kwargs)
        self.fields['path'].required = False
        self.fields['original_file_name'].required = False
        if 'data' in kwargs and 'file' in kwargs['data']:
            # self.fields['file'] = serializers.FileField()
            self.fields['gallery'] = serializers.CharField()
            self.fields['upload_type'] = serializers.CharField()
            self.fields['upload_type'].required = False

    def create(self, validated_data):
        import os
        from airbook.settings import MEDIA_ROOT
        if 'file' in validated_data:
            file = validated_data.pop('file')

            if (file.size/(1000 * 1000)) > 20:
                raise serializers.ValidationError('Image should not be greater than 20 MB')

            gallery = validated_data.pop('gallery')
            if gallery != 'airbook':
                user = validated_data.pop('user')
            upload_type = False
            if 'upload_type' in validated_data and validated_data.pop('upload_type') is not None:
                upload_type = True
                if gallery != 'airbook':
                    tpath = 'user/{}/{}'.format(user.id,file.name)
                    if os.path.isfile(os.path.join(MEDIA_ROOT, tpath)):
                        os.remove(os.path.join(MEDIA_ROOT, tpath))
            self.fields.pop('file')
            self.fields.pop('gallery')
            if gallery == 'user':
                validated_data['path'] = 'user/{}'.format(user.id)
                validated_data['mediable_id'] = user.id
                validated_data['mediable_type'] = 'App\\User'
                validated_data['meta_name'], validated_data['type'] = os.path.splitext(file.name)
            elif gallery == 'airbook':
                validated_data['accessibility'] = True
                validated_data['path'] = 'global'
                validated_data['mediable_id'] = 1
                validated_data['mediable_type'] = 'Global'
            elif gallery == 'mediable':
                user = validated_data.pop('user')
                validated_data['path'] = 'user/{}'.format(user.id)
                validated_data['mediable_id'] = validated_data.pop('mediable_id')
                validated_data['mediable_type'] = 'App\\{}'.format(validated_data.pop('mediable_type'))
                validated_data['meta_name'], validated_data['type'] = os.path.splitext(file.name)

            validated_data['type'] = file.content_type
            validated_data['original_file_name'] = file
            rid = super(MediasSerializer, self).create(validated_data)

            if upload_type:
                AbMedias.objects.get(id=rid.id).delete()
            return rid

    class Meta:
        model = AbMedias
        fields = ('id','user','accessibility','mediable_type', 'mediable_id','meta_name', 'type', 'path', 'original_file_name', 'is_featured', 'file', 'is_active', 'created_at', 'updated_at')
        datatables_always_serialize = ('id',)



class AttachesSerializer(serializers.ModelSerializer):

    def __init__(self, *args, **kwargs):
        super(AttachesSerializer, self).__init__(*args, **kwargs)
        self.fields['existing_id'] = serializers.IntegerField(required=False)

    def create(self, validated_data):
        # existing attachement - no need to create again
        if 'existing_id' in validated_data:
            existing_id = validated_data.pop('existing_id')
            self.fields.pop('existing_id')
            return AbAttaches.objects.get(id=existing_id)

        user = self.context['request'].user
        if user.groups.filter(name = 'Admin').exists() or user.id == validated_data['user'].id:
            validated_data['attachable_type'] = 'App\\{}'.format(validated_data['attachable_type'])
            validated_data['attachable_id'] = 0
            validated_data['path'] = '{}/attachment/Aircraft'.format(validated_data['user'].id)
            return super(AttachesSerializer, self).create(validated_data)

    class Meta:
        model = AbAttaches
        fields = ('id','user','accessibility','attachable_type', 'attachable_id', 'type', 'path', 'original_file_name', 'is_featured', 'is_active', 'created_at', 'updated_at')
        datatables_always_serialize = ('id',)


class AbPricingSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    def __init__(self, *args, **kwargs):
        super(AbPricingSerializer, self).__init__(*args, **kwargs)

    def to_representation(self, instance):
        representation = super(AbPricingSerializer, self).to_representation(instance)
        # if isRoleUser(self.context['request'].user):
        try:
            representation['credits'] = to_dict(instance.abcredits_set.filter(user=self.context['request'].user).first())
        except:
            representation['credits'] = {"cart_val":0}

        try:
            representation['promoted'] = globals()['Ab{}s'.format(instance.name.capitalize())].objects.filter(is_featured=1).count()
        except:
            representation['promoted'] = {"cart_val":0}
        return representation

    class Meta:
        model = AbPricing
        fields = ('id','name','price','description','discount','discount_after', 'created_at', 'updated_at')
        datatables_always_serialize = ('id',)


class AbCreditsSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    def __init__(self, *args, **kwargs):
        super(AbCreditsSerializer, self).__init__(*args, **kwargs)

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super(AbCreditsSerializer, self).create(validated_data)

    class Meta:
        model = AbCredits
        fields = ('id','cart_val','pricing')
        datatables_always_serialize = ('id',)

class ViewsSerializer(serializers.ModelSerializer):
    def __init__(self, *args, **kwargs):
        super(ViewsSerializer, self).__init__(*args, **kwargs)

    class Meta:
        model = models.AbViews
        fields = ('id', 'viewable_id', 'viewable_type', 'created_at', 'updated_at')
        datatables_always_serialize = ('id', 'viewable_id', 'viewable_type')

class AbGlobalSerializer(serializers.ModelSerializer):
    def __init__(self, *args, **kwargs):
        super(AbGlobalSerializer, self).__init__(*args, **kwargs)

    def to_representation(self, instance):
        representation = super(AbGlobalSerializer, self).to_representation(instance)
        try:
            if instance.model == 'Company':
                django_model = 'AbCompanies'
            else:
                django_model = 'Ab{}s'.format(instance.model)
            representation['detail'] = globals()[django_model].objects.filter(id=instance.model_id).first()
        except:
            representation['detail'] = None  

        actual_instance =  representation['detail']

        if actual_instance is not None:
            representation['detail'] = to_dict(actual_instance)

            if instance.model in ['Aircraft', 'Engine', 'Apu','Contact', 'Company']:
                if instance.model in ['Contact', 'Company']:
                    is_featured = 0
                else:
                    is_featured = 1

                try:
                    representation['media'] = AbMedias.getThumb(actual_instance, 'App\\{}'.format(instance.model), is_featured)
                except:
                    representation['media'] = None 

            if instance.model == 'Company':
                try:
                    representation['contacts'] = actual_instance.contact.count()
                except:
                    representation['contacts'] = None

            related_models = []

            if instance.model in ['Aircraft','Apu']:
                related_models = ['type','model','manufacturer','current_location', 'primary_contact']

            elif instance.model == 'Engine':
                related_models = ['type','model','manufacturer','current_location','category']

            elif instance.model == 'Wanted':
                related_models = ['type_0','model','manufacturer','primary_contact',]

            elif instance.model == 'Airport':
                related_models = ['country', 'airfield_type']

            elif instance.model == 'Contact':
                related_models = ['country']

            elif instance.model == 'Company':
                related_models = ['country']

            for model in related_models:
                try:
                    representation['detail'][model] = to_dict(getattr(actual_instance, model))
                except:
                    representation['detail'][model] = None


            if instance.model in ['Aircraft', 'Engine', 'Apu','Wanted']:
                if self.context['request'].user.is_authenticated :
                    representation['liked'] = AbLikes.objects.filter(likable_id=instance.model_id, likable_type='App\\{}'.format(instance.model), user=self.context['request'].user).count()
                else:
                    representation['liked'] = 0

                if self.context['request'].user.is_authenticated :
                    representation['favourite'] = AbFavourites.objects.filter(favouritable_id=instance.model_id, favouritable_type='App\\{}'.format(instance.model), user=self.context['request'].user).exists()
                else:
                    representation['favourite'] = False

            elif instance.model == 'Contact':
                try:
                    representation['company'] = CompanySerializer(actual_instance.company).data
                except:
                    representation['company'] = None

                if self.context['request'].user.is_authenticated :
                    representation['connected'] = AbConnections.objects.filter(user=self.context['request'].user, conected_user=actual_instance.user).count()
                else:
                    representation['connected'] = 0

                
        return representation

    class Meta:
        model = AbGlobal
        fields = ('model_id','model', 'title')
        datatables_always_serialize = ('id',)

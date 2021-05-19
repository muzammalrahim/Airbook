from rest_framework import serializers
from connect.models import AbContacts, AbCountries,AbCompanies
from account.models import *
from info.models import  AbCategories, AbCategoryManufacturer, AbMedias, AbCannedemails
from info.serializers import CategorySerializer,CountrySerializer
from connect.serializers import ContactSerializer, CompanySerializer, Base64ImageField
from django.contrib.auth.models import Group, Permission
from django.contrib.auth.hashers import make_password
from rest_framework.validators import UniqueValidator
import datetime
from django.db.models import Q
from django.conf import settings
from django.contrib.auth.validators import UnicodeUsernameValidator
# from auditlog.models import LogEntry
from django.contrib.contenttypes.models import ContentType
from default.services import to_dict,send_emails, decodeBase64Image
from django.template.loader import get_template
from django.template import Template, Context
from django.utils.safestring import mark_safe
from django.core.files.uploadedfile import InMemoryUploadedFile
import io


class PermissionSerializer(serializers.ModelSerializer):
    name = serializers.CharField(validators=[UniqueValidator(queryset=Permission.objects.all())], max_length=150)
    # add role base profile fields here
    def __init__(self, *args, **kwargs):
        super(PermissionSerializer, self).__init__(*args, **kwargs)

    class Meta:
        model = Permission
        fields = ('id', 'name')

class ContentTypeSerializer(serializers.ModelSerializer):
    permission_set = PermissionSerializer(many=True)

    def __init__(self, *args, **kwargs):
        super(ContentTypeSerializer, self).__init__(*args, **kwargs)

    class Meta:
        model = ContentType
        fields = ('id', 'model', 'permission_set')
        datatables_always_serialize = ('id','model','permission_set')



class GroupSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(validators=[UniqueValidator(queryset=Group.objects.all())], max_length=150)
    permissions = serializers.PrimaryKeyRelatedField(many=True, required=False, queryset=Permission.objects.all())
    # add role base profile fields here
    def __init__(self, *args, **kwargs):
        super(GroupSerializer, self).__init__(*args, **kwargs)

    def update(self, instance, validated_data):
        if 'permissions' in validated_data:
            permissions = validated_data.pop('permissions')
            instance.permissions.set(permissions)

        instance.name = validated_data.get('email', instance.name)
        instance.save()
        return instance

    # def to_representation(self, instance):
    # 	representation = super(GroupSerializer, self).to_representation(instance)
    # 	representation['permissions'] = PermissionSerializer(instance.permissions.all(), many=True).data
    # 	return representation

    class Meta:
        model = Group
        fields = ('id','name', 'permissions')

class ContactSerializer(serializers.ModelSerializer):
    file = Base64ImageField(max_length=None, use_url=True, required=False)
    id = serializers.IntegerField(read_only=True)

    company = serializers.PrimaryKeyRelatedField(required=False, queryset=AbCompanies.objects.all())
    def to_representation(self, instance):
        representation = super(ContactSerializer, self).to_representation(instance)
        try:
            representation['company'] = CompanySerializer(instance.company).data
        except:
            representation['company'] = None
        try:
            representation['job_title'] = TitlesSerializer(instance.job_title).data
        except:
            representation['job_title'] = None

        return representation
    class Meta:
        model = AbContacts
        fields = ('id','first_name','last_name','company','job_title', 'file')
        datatables_always_serialize = ('id',)


class UsersSerializer(serializers.ModelSerializer):   #  used to get user profile
    # groups = GroupSerializer(many=True, read_only=True)
    # user_permissions = PermissionSerializer(many=True)
    # user_permissions = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, required=True, )
    groups = serializers.PrimaryKeyRelatedField(many=True, read_only=False, required=False, queryset=Group.objects.all())
    user_permissions = serializers.PrimaryKeyRelatedField(many=True, read_only=False, queryset=Permission.objects.all())
    id = serializers.IntegerField(read_only=True)
    email = serializers.EmailField(validators=[UniqueValidator(queryset=AbUsers.objects.all())])
    contact = ContactSerializer(write_only=True, many=True)

    # add role base profile fields here
    def __init__(self, *args, **kwargs):
        super(UsersSerializer, self).__init__(*args, **kwargs)

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data.get('password'))
        contact_data = validated_data.pop('contact')[0]
        permissions = validated_data.pop('user_permissions')
        if self.context['request'].user.is_authenticated:
            groups = validated_data.pop('groups')

        else:
            groups = [Group.objects.filter(Q(name='user') | Q(name='User')).first()]

        user = AbUsers.objects.create(**validated_data)

        if self.context['request'].user.is_authenticated:
            loggedInUser = self.context['request'].user
        else:
            loggedInUser = user

        # add contact info
        file_ = None
        if 'file' in contact_data:
            file_ = contact_data.pop('file')
        cont = AbContacts.objects.create(user=user, creator=loggedInUser, **contact_data)

        if file_ is not None:
            AbMedias(
                mediable_type='App\\Contact',
                mediable_id=cont.id,
                path='Contact',
                original_file_name=file_,
                is_active=1,
                accessibility=1,
                is_featured=0
            ).save()

        user.groups.set(groups)
        if self.context['request'].user.is_authenticated:
            user.user_permissions.set(permissions)

        # send email to user
        
        import uuid
        keyUUID = uuid.uuid4()
        user.email_verified = str(keyUUID)
        user.save()

        email_template = AbCannedemails.objects.get(message_type='user-registration')
        
        subject = email_template.subject
        user_contact = user.contact.first()
        url = '{}/login?token={}'.format(settings.SITE_URL, user.email_verified)
        context = {
                    'user': str(user_contact.first_name) + " " + str(user_contact.last_name),
                    'name':mark_safe('<a href="{}")>Confirm Email</a>'.format(url)),
                }
        context = {'email_content': Template(mark_safe(email_template.message)).render(Context(context))}
        context['year'] = datetime.datetime.now().year
        context['footer_message'] = Template(mark_safe(email_template.footer_message)).render(Context({'asset':email_template.footer_message}))
        html_content = get_template('email/canned/general.html').render(context)

        send_emails(subject, html_content, [user.email], email_template.sending_email)

        return user

    def update(self, instance, validated_data):
        if 'contact' in validated_data:
            try:
                contact_data = validated_data.pop('contact')[0]
                contact = instance.contact.first()
                contact.first_name = contact_data.get('first_name', contact.first_name)
                contact.last_name = contact_data.get('last_name', contact.last_name)
                contact.company = contact_data.get('company', None)
                contact.save()
            except:
                pass

        if 'user_permissions' in validated_data:
            permissions_data = validated_data.pop('user_permissions')
            # permission_ids = [val.get('id') for val in permissions_data]
            instance.user_permissions.set(permissions_data)

        if 'groups' in validated_data:
            groups = validated_data.pop('groups')
            instance.groups.clear()
            instance.groups.add(*groups);

        instance.email = validated_data.get('email', instance.email)
        instance.is_active = validated_data.get('is_active', instance.is_active)
        new_password = validated_data.get('password', None)
        if new_password is not None:
            instance.password = make_password(new_password)
        instance.save()
        return instance

    def to_representation(self, instance):
        representation = super(UsersSerializer, self).to_representation(instance)
        try:
            representation['group_name'] = instance.groups.first().name
        except:
            representation['group_name'] = ''
        try:
            representation['contact'] = ContactSerializer(instance.contact.first()).data
        except:
            representation['contact'] = None
        return representation

    class Meta:
        model = AbUsers
        fields = ('id','email','is_active','password', 'groups','contact','user_permissions', 'remember_token','stripe_id','card_brand','card_last_four','trial_ends_at','transaction_id','order_id','trans_date','deleted_at','created_at','updated_at','new_password','is_staff')
        datatables_always_serialize = ('id','contact','group_name')


class CategoryManufacturerSerializer(serializers.ModelSerializer):
    manufacturer = serializers.IntegerField(read_only=True)

    def __init__(self, *args, **kwargs):
        super(CategoryManufacturerSerializer, self).__init__(*args, **kwargs)

    class Meta:
        model = AbCategoryManufacturer
        fields = ('manufacturer','category')



#        Manufacturers   Serializer  #

class ManufacturersSerializer(serializers.ModelSerializer):   #  used to get user profile
    file = Base64ImageField(max_length=None, use_url=True, required=False)
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(max_length=150)
    type = serializers.CharField()
    categories = serializers.PrimaryKeyRelatedField(many=True, write_only=True, queryset=AbCategories.objects.all())
    country = serializers.PrimaryKeyRelatedField(read_only=False, queryset=AbCountries.objects.all(), required=False)

    def __init__(self, *args, **kwargs):
        super(ManufacturersSerializer, self).__init__(*args, **kwargs)

    def create(self, validated_data):
        categories = validated_data.pop('categories')
        if 'file' in validated_data:
            file = validated_data.pop('file')
            manufacturer = super(ManufacturersSerializer, self).create(validated_data)
            AbMedias(
                mediable_type='App\\Manufacturer',
                mediable_id=manufacturer.id,
                path='Manufacturer',
                original_file_name=file,
                is_active=1,
                accessibility=1,
                is_featured=0
            ).save()
        else:
            manufacturer = super(ManufacturersSerializer, self).create(validated_data)

        for category in categories:
            try:
                manufacturers = AbManufacturers.objects.filter(name=manufacturer.name,type=manufacturer.type)
                if manufacturers.exists():
                    if AbCategoryManufacturer.objects.filter(manufacturer__in=manufacturers, category=category).exists():
                        continue

                manufacturer.categories.add(category)
            except ValueError as e:
                print(e)

        return manufacturer

    def update(self, instance, validated_data):
        categories = validated_data.pop('categories')
        existing_categories = list(instance.categories.values_list('id', flat=True))

        if 'file' in validated_data:
            file = validated_data.pop('file')

            # delete old one
            media = AbMedias.objects.filter(mediable_type='App\\Manufacturer', mediable_id=instance.id)
            if media.exists():
                media.first()._delete_file()
                media.first().delete()

            AbMedias(
                mediable_type='App\\Manufacturer',
                mediable_id=instance.id,
                path='Manufacturer',
                original_file_name=file,
                is_active=1,
                accessibility=1,
                is_featured=0
            ).save()
        else:
            media = AbMedias.objects.filter(mediable_type='App\\Manufacturer', mediable_id=instance.id)
            if media.exists():
                media.first()._delete_file()
                media.first().delete()

        manufacturer = super(ManufacturersSerializer, self).update(instance, validated_data)

        # lets attache categories with manufactures
        for category in categories:
            # check if already attached than ignore
            if category.id in existing_categories:
                existing_categories.remove(category.id)
            else:
                try:
                    manufacturers = AbManufacturers.objects.filter(name=manufacturer.name,type=manufacturer.type)
                    if manufacturers.exists():
                        if AbCategoryManufacturer.objects.filter(manufacturer__in=manufacturers, category=category).exists():
                            continue

                    manufacturer.categories.add(category)
                except ValueError as e:
                    print(e)

        # check if already attached categorie is remove
        manufacturer.categories.remove(*existing_categories)

        return manufacturer

    def to_representation(self, instance):
        representation = super(ManufacturersSerializer, self).to_representation(instance)
        try:
            representation['categories'] = CategorySerializer(instance.categories, many=True).data
        except:
            representation['categories'] = None
        try:
            representation['country'] = CountrySerializer(instance.country).data
        except:
            representation['country'] = None
        return representation
    class Meta:
        model = AbManufacturers
        fields = ('id', 'type', 'name','categories', 'is_active','description','country','established','file','created_at','updated_at')
        datatables_always_serialize = ('id','name','is_active','categories')


#######################    Types    Serializer  #################

class TypesSerializer(serializers.ModelSerializer):
    file = Base64ImageField(max_length=None, use_url=True, required=False)
    # manufacturer_id = serializers.PrimaryKeyRelatedField(write_only=True, queryset=AbManufacturers.objects.all())
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(validators=[UniqueValidator(queryset=AbTypes.objects.all())], max_length=150)

    def __init__(self, *args, **kwargs):
        super(TypesSerializer, self).__init__(*args, **kwargs)
        self.fields['manufacturer'].required = True

    def create(self, validated_data):
        if 'file' in validated_data:
            file = validated_data.pop('file')
            type = super(TypesSerializer, self).create(validated_data)
            AbMedias(
                mediable_type='App\\Type',
                mediable_id=type.id,
                path='Type',
                original_file_name=file,
                is_active=1,
                accessibility=1,
                is_featured=0
            ).save()
        else:
            type = super(TypesSerializer, self).create(validated_data)
        return type

    def update(self, instance, validated_data):
        if 'file' in validated_data:
            file = validated_data.pop('file')

            # delete old one
            media = AbMedias.objects.filter(mediable_type='App\\Type', mediable_id=instance.id)
            if media.exists():
                media.first()._delete_file()
                media.first().delete()

            AbMedias(
                mediable_type='App\\Type',
                mediable_id=instance.id,
                path='Type',
                original_file_name=file,
                is_active=1,
                accessibility=1,
                is_featured=0
            ).save()
        else:
            media = AbMedias.objects.filter(mediable_type='App\\Type', mediable_id=instance.id)
            if media.exists():
                media.first()._delete_file()
                media.first().delete()

        return super(TypesSerializer, self).update(instance, validated_data)

    def to_representation(self, instance):
        representation = super(TypesSerializer, self).to_representation(instance)
        related_modes = ['manufacturer']
        for model in related_modes:
            try:
                representation[model] = to_dict(getattr(instance, model))
            except:
                representation[model] = None
        return representation

    class Meta:
        model = AbTypes
        fields = ('id','name','description', 'type', 'file','manufacturer','is_active','created_at','updated_at')
        datatables_always_serialize = ('id','name','is_active','manufacturer','type')




class ModalsSerializer(serializers.ModelSerializer):
    file = Base64ImageField(max_length=None, use_url=True, required=False)
    #type_0 = serializers.PrimaryKeyRelatedField(write_only=True, queryset=AbTypes.objects.all())
    id    = serializers.IntegerField(read_only=True)
    name  = serializers.CharField(validators=[UniqueValidator(queryset=AbModels.objects.all())], max_length=150)
    # type_0 = TypesSerializer(write_on=True)

    def __init__(self, *args, **kwargs):
        super(ModalsSerializer, self).__init__(*args, **kwargs)

    def create(self, validated_data):
        if 'file' in validated_data:
            file = validated_data.pop('file')
            modeles = super(ModalsSerializer, self).create(validated_data)
            AbMedias(
                mediable_type='App\\Modeled',
                mediable_id=modeles.id,
                path='Modeled',
                original_file_name=file,
                is_active=1,
                accessibility=1,
                is_featured=0
            ).save()

        else:
            modeles = super(ModalsSerializer, self).create(validated_data)

        return modeles

    def update(self, instance, validated_data):
        if 'file' in validated_data:
            file = validated_data.pop('file')

            # delete old one
            media = AbMedias.objects.filter(mediable_type='App\\Modeled', mediable_id=instance.id)
            if media.exists():
                media.first()._delete_file()
                media.first().delete()

            AbMedias(
                mediable_type='App\\Modeled',
                mediable_id=instance.id,
                path='Modeled',
                original_file_name=file,
                is_active=1,
                accessibility=1,
                is_featured=0
            ).save()
        else:
            media = AbMedias.objects.filter(mediable_type='App\\Modeled', mediable_id=instance.id)
            if media.exists():
                media.first()._delete_file()
                media.first().delete()

        return super(ModalsSerializer, self).update(instance, validated_data)

    def to_representation(self, instance):
        representation = super(ModalsSerializer, self).to_representation(instance)

        try:
            representation['_type'] = to_dict(getattr(instance, 'type_0'))
        except:
            representation['_type'] = None

        return representation

    class Meta:
        model = AbModels
        fields = ('id','name','is_active','type_0', 'description', 'type','file', 'created_at','updated_at')
        datatables_always_serialize = ('id','name','is_active','_type', 'type_0', 'type')


class TitlesSerializer(serializers.ModelSerializer):
    name = serializers.CharField(validators=[UniqueValidator(queryset=AbTitles.objects.all())], max_length=150)

    class Meta:
        model = AbTitles
        fields = ('id','name','is_active','created_at','updated_at')
        datatables_always_serialize = ('id',)


class AccesslogsSerializer(serializers.ModelSerializer):

    def to_representation(self, instance):
        representation = super(AccesslogsSerializer, self).to_representation(instance)
        try:
            representation['user'] = ContactSerializer(instance.user.contact, many=True).data[0]
        except:
            representation['user'] = None
        return representation

    class Meta:
        model = AbAccesslogs
        fields = ('id','user','user_id','payload','created_at','updated_at')
        datatables_always_serialize = ('id','user')


class SubscriberSerializer(serializers.ModelSerializer):
    id    = serializers.IntegerField(read_only=True)

    class Meta:
        model = AbSubscribers
        fields = ('id','name','email','comments', 'is_active', 'created_at','updated_at')
        datatables_always_serialize = ('id','user')


class SuggestionsSerializer(serializers.ModelSerializer):

    def to_representation(self, instance):
        representation = super(SuggestionsSerializer, self).to_representation(instance)
        try:
            representation['user'] = to_dict(instance.user)
            representation['user']['name'] = representation['user']['email']
            try:
                contact = to_dict(instance.user.contact)
                representation['user']['name'] = contact.first_name+' '+contact.last_name
            except:
                pass
        except:
            representation['user'] = None
        return representation

    class Meta:
        model = AbSuggestions
        fields = ('id','user','entity_type','category', 'manufacturer','type', 'model', 'created_at','updated_at')
        datatables_always_serialize = ('id','user')


# class LogEntrySerializer(serializers.ModelSerializer):
# 	def __init__(self, *args, **kwargs):
# 		super(LogEntrySerializer, self).__init__(*args, **kwargs)

# 	class Meta:
# 		model = LogEntry
# 		fields = ('id','action',)



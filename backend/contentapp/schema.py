import graphene
from graphene_django import DjangoObjectType

from .models import SiteContent, SiteSettings


class SiteContentType(DjangoObjectType):
    hero_image_url = graphene.String()
    about_image_url = graphene.String()
    webshop_image_url = graphene.String()
    class Meta:
        model = SiteContent
        fields = (
            "id",
            "hero_title",
            "hero_subtitle",
            "hero_image",
            "hero_button_text",
            "hero_button_url",
            "hero_image",
            "about_title",
            "about_subtitle",
            "about_image",
            "about_body",
            "webshop_image",
            "updated_at"
        )

    def resolve_hero_image_url(self, info):
        if self.hero_image:
            return info.context.build_absolute_uri(self.hero_image.url)
        return None
    
    def resolve_about_image_url(self, info):
        if self.about_image:
            return info.context.build_absolute_uri(self.about_image.url)
        return None
    
    def resolve_webshop_image_url(self, info):
        if self.webshop_image:
            return info.context.build_absolute_uri(self.webshop_image.url)
        return None

class SiteSettingsType(DjangoObjectType):
    class Meta:
        model = SiteSettings
        fields = ("id", "merchant_order_email", "updated_at")


class UpdateSiteContent(graphene.Mutation):
    class Arguments:
        hero_title = graphene.String()
        hero_subtitle = graphene.String()
        about_title = graphene.String()
        about_body = graphene.String()

    site_content = graphene.Field(SiteContentType)
    success = graphene.Boolean()

    def mutate(self, info, **kwargs):
        try:
            site_content, created = SiteContent.objects.get_or_create(id=1)
            
            for field, value in kwargs.items():
                if value is not None:
                    setattr(site_content, field, value)
            
            site_content.save()
            return UpdateSiteContent(site_content=site_content, success=True)
        except Exception as e:
            raise Exception(str(e))


class UpdateSiteSettings(graphene.Mutation):
    class Arguments:
        merchant_order_email = graphene.String()

    site_settings = graphene.Field(SiteSettingsType)
    success = graphene.Boolean()

    def mutate(self, info, **kwargs):
        try:
            site_settings, created = SiteSettings.objects.get_or_create(id=1)
            
            for field, value in kwargs.items():
                if value is not None:
                    setattr(site_settings, field, value)
            
            site_settings.save()
            return UpdateSiteSettings(site_settings=site_settings, success=True)
        except Exception as e:
            raise Exception(str(e))


class ContentQuery(graphene.ObjectType):
    site_content = graphene.Field(SiteContentType)
    site_settings = graphene.Field(SiteSettingsType)

    def resolve_site_content(self, info):
        site_content, created = SiteContent.objects.get_or_create(id=1)
        return site_content

    def resolve_site_settings(self, info):
        site_settings, created = SiteSettings.objects.get_or_create(id=1)
        return site_settings


class ContentMutation(graphene.ObjectType):
    update_site_content = UpdateSiteContent.Field()
    update_site_settings = UpdateSiteSettings.Field()

from django.db import models


class SiteContent(models.Model):
    # Hero blokk
    hero_image = models.ImageField(upload_to="site/", blank=True, null=True)
    hero_title = models.CharField(max_length=120, blank=True, default="")
    hero_subtitle = models.CharField(max_length=240, blank=True, default="")
    hero_button_text = models.CharField(max_length=60, blank=True, default="")
    hero_button_url = models.CharField(max_length=200, blank=True, default="")

    # About us blokk
    about_image = models.ImageField(upload_to="site/", blank=True, null=True)
    about_title = models.CharField(max_length=120, blank=True, default="")
    about_subtitle = models.CharField(max_length=240, blank=True, default="")
    about_body = models.TextField(blank=True, default="")

    webshop_image = models.ImageField(upload_to="site/", blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # opcionális: singleton enforce az app rétegben
    def __str__(self):
        return "Site Content"


class SiteSettings(models.Model):
    merchant_order_email = models.EmailField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "Site Settings"
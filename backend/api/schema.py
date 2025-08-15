import graphene
from graphene_django import DjangoObjectType
from django.db.models import Q,  Sum
from django.conf import settings

from catalog.models import Category, Product, ProductImage
from orders.models import Order, OrderItem
from contentapp.models import SiteContent
from contact.models import ContactMessage


# ============ GraphQL Types ============

class CategoryType(DjangoObjectType):
    class Meta:
        model = Category
        fields = ("id", "name", "slug", "created_at", "updated_at", "products")


class ProductImageType(DjangoObjectType):
    class Meta:
        model = ProductImage
        fields = ("id", "image", "alt", "ordering", "created_at", "updated_at")


class ProductType(DjangoObjectType):
    image_url = graphene.String()

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "price",
            "image",
            "image_url",
            "category",
            "sku",
            "stock_qty",
            "is_active",
            "created_at",
            "updated_at",
            "images",
        )

    def resolve_image_url(self, info):
        if self.image:
            try:
                return info.context.build_absolute_uri(self.image.url)
            except Exception:
                return self.image.url
        return None


class SiteContentType(DjangoObjectType):
    hero_image_url = graphene.String()
    about_image_url = graphene.String()
    webshop_image_url = graphene.String()

    class Meta:
        model = SiteContent
        fields = (
            "id",
            "hero_image",
            "hero_title",
            "hero_subtitle",
            "hero_button_text",
            "hero_button_url",
            "about_image",
            "about_title",
            "about_subtitle",
            "about_body",
            "created_at",
            "updated_at",
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


class OrderItemType(DjangoObjectType):
    class Meta:
        model = OrderItem
        fields = (
            "id",
            "name_snapshot",
            "unit_price_snapshot",
            "quantity",
            "line_total",
            "created_at",
        )


class OrderType(DjangoObjectType):
    class Meta:
        model = Order
        fields = (
            "id",
            "customer_name",
            "customer_email",
            "customer_phone",
            "shipping_address",
            "shipping_city",
            "shipping_zip",
            "delivery_notes",
            "preferred_delivery_time",
            "status",
            "subtotal",
            "discount_total",
            "shipping_fee",
            "grand_total",
            "created_at",
            "updated_at",
            "items",
        )

class ContactMessageType(DjangoObjectType):
    class Meta:
        model = ContactMessage
        fields = (
            "id",
            "name",
            "email",
            "phone",
            "message",
            "handled",
            "created_at",
            "updated_at",
        )        


# ============ Queries ============

class Query(graphene.ObjectType):
    # Alap
    ping = graphene.String(description="Healthcheck")

    # Tartalom
    site_content = graphene.Field(SiteContentType, description="Nyitóoldal tartalom (singleton)")

    # Kategóriák
    categories = graphene.List(CategoryType, description="Minden kategória név szerinti rendezésben")
    category = graphene.Field(CategoryType, slug=graphene.String(required=True))

    # Termékek
    products = graphene.List(
        ProductType,
        search=graphene.String(required=False),
        category_slug=graphene.String(required=False),
        category_id=graphene.Int(required=False),
        is_active=graphene.Boolean(required=False),
        limit=graphene.Int(required=False),
        offset=graphene.Int(required=False),
        description="Terméklista egyszerű szűrőkkel és lapozással",
    )

    product = graphene.Field(
        ProductType,
        slug=graphene.String(required=True),
        description="Termék lekérése slug alapján",
    )

    popular_products = graphene.List(
        ProductType,
        limit=graphene.Int(required=False, default_value=3)
    )

    def resolve_ping(self, info):
        return "pong"

    def resolve_site_content(self, info):
        return SiteContent.objects.first()

    def resolve_categories(self, info):
        return Category.objects.order_by("name").all()

    def resolve_category(self, info, slug):
        return Category.objects.filter(slug=slug).first()

    def resolve_products(self, info, search=None, category_slug=None, category_id=None, is_active=True, limit=20, offset=0):
        qs = Product.objects.all().select_related("category").prefetch_related("images")
        if is_active is not None:
            qs = qs.filter(is_active=is_active)
        if category_slug:
            qs = qs.filter(category__slug=category_slug)
        if category_id:
            qs = qs.filter(category_id=category_id)    
        if search:
            s = search.strip()
            qs = qs.filter(
                Q(name__icontains=s)
                | Q(description__icontains=s)
                | Q(sku__icontains=s)
            )
        qs = qs.order_by("name")
        return list(qs[offset : offset + (limit or 20)])

    def resolve_product(self, info, slug):
        return Product.objects.select_related("category").prefetch_related("images").filter(slug=slug).first()
    

    def resolve_popular_products(self, info, limit):
        return (
            Product.objects
            .filter(order_items__order__status=Order.Status.DELIVERED)
            .annotate(total_sold=Sum("order_items__quantity"))
            .order_by("-total_sold")[:limit]
        )

class CreateContactMessage(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        email = graphene.String(required=False)
        phone = graphene.String(required=False)
        message = graphene.String(required=True)

    contact_message = graphene.Field(ContactMessageType)

    def mutate(self, info, name, message, email=None, phone=None):
        if not email and not phone:
            raise Exception("Legalább e-mailt vagy telefonszámot meg kell adni.")

        contact_message = ContactMessage.objects.create(
            name=name,
            email=email,
            phone=phone,
            message=message
        )
        return CreateContactMessage(contact_message=contact_message)


class Mutation(graphene.ObjectType):
    create_contact_message = CreateContactMessage.Field()

schema = graphene.Schema(query=Query, mutation=Mutation)
import graphene
from graphene_django import DjangoObjectType
from django.db.models import Q

from .models import Category, Product, ProductImage


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
            return info.context.build_absolute_uri(self.image.url)
        return None


class CatalogQuery(graphene.ObjectType):
    categories = graphene.List(CategoryType)
    products = graphene.List(
        ProductType,
        category=graphene.String(),
        search=graphene.String(),
        is_active=graphene.Boolean()
    )
    product = graphene.Field(ProductType, slug=graphene.String(required=True))

    def resolve_categories(self, info):
        return Category.objects.all().order_by("name")

    def resolve_products(self, info, category=None, search=None, is_active=True):
        queryset = Product.objects.filter(is_active=is_active).select_related("category").prefetch_related("images")
        
        if category:
            queryset = queryset.filter(category__slug=category)
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        
        return queryset.order_by("name")

    def resolve_product(self, info, slug):
        try:
            return Product.objects.select_related("category").prefetch_related("images").get(slug=slug, is_active=True)
        except Product.DoesNotExist:
            return None

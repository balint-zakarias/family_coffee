import graphene
from graphene_django import DjangoObjectType
from django.db.models import Q, Sum

from .models import Category, Product, ProductImage
from orders.models import Order

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
    category_slug = graphene.String()

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
    
    def resolve_category_slug(self, info):
        if self.category:
            return self.category.slug
        return None


class CatalogQuery(graphene.ObjectType):
    categories = graphene.List(CategoryType)
    products = graphene.List(
        ProductType,
        category_id=graphene.Int(),
        category_slug=graphene.String(),
        search=graphene.String(),
        is_active=graphene.Boolean(),
        limit=graphene.Int(),
    )
    product = graphene.Field(ProductType, slug=graphene.String(required=True))

    def resolve_categories(self, info):
        return Category.objects.all().order_by("name")

    def resolve_products(self, info, category_slug=None, category_id=None, search=None, limit=None, is_active=True):
        queryset = Product.objects.filter(is_active=is_active).select_related("category").prefetch_related("images")
        
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        if category_id:
            queryset = queryset.filter(category__id=category_id)    
        
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
        
class PopularProductsQuery(graphene.ObjectType):
    popular_products = graphene.List(
        ProductType,
        limit=graphene.Int(required=False, default_value=3)
    )

    def resolve_popular_products(self, info, limit):
        pp = Product.objects.filter(order_items__order__status=(Order.Status.DELIVERED or Order.Status.PLACED)).annotate(total_sold=Sum("order_items__quantity")).order_by("-total_sold")[:limit]

        print("Resolving popular products with limit:", limit)
        print("Popular products:", pp)
        return (
            pp
        )        

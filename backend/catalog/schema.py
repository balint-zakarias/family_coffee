import os, uuid
import graphene
from graphene_django import DjangoObjectType
from graphene_file_upload.scalars import Upload
from django.core.files.storage import default_storage
from django.db.models import Q, Sum
from django.utils.text import slugify

from .models import Category, Product, ProductImage
from orders.models import Order

class ProductInput(graphene.InputObjectType):
    id = graphene.ID()
    name = graphene.String(required=True)
    slug = graphene.String()
    description = graphene.String()
    price = graphene.Float(required=True)
    image = Upload()  # Fájl feltöltés
    image_url = graphene.String()  # URL alternatíva
    category_id = graphene.Int()
    sku = graphene.String()
    ean = graphene.String()
    ean_carton = graphene.String()
    neta = graphene.Float()
    vat = graphene.Float()
    stock_qty = graphene.Int()
    is_active = graphene.Boolean()

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
            "ean",
            "ean_carton",
            "neta",
            "vat",
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
        offset=graphene.Int(),
    )
    product = graphene.Field(ProductType, slug=graphene.String(required=True))

    def resolve_categories(self, info):
        return Category.objects.all().order_by("name")

    def resolve_products(self, info, category_slug=None, category_id=None, search=None, limit=12, offset=0, is_active=True):
        queryset = Product.objects.all().select_related("category").prefetch_related("images")

        if is_active is not None:
            queryset = queryset.filter(is_active=is_active)
        
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        if category_id:
            queryset = queryset.filter(category__id=category_id)    
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        
        queryset = queryset.order_by("name")
        return queryset[offset:offset + limit]

    def resolve_product(self, info, slug):
        try:
            return Product.objects.select_related("category").prefetch_related("images").get(slug=slug)
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


class CreateProduct(graphene.Mutation):
    class Arguments:
        input = ProductInput(required=True)
        image = Upload()

    product = graphene.Field(ProductType)

    @classmethod
    def mutate(cls, root, info, input, image=None):
        # Create product
        product_data = {
            'name': input.name,
            'slug': slugify(input.name),
            'description': input.description or '',
            'price': input.price,
            'sku': input.sku or '',
            'ean': input.ean or '',
            'ean_carton': input.ean_carton or '',
            'neta': input.neta or 0,
            'vat': input.vat or 27.00,
            'stock_qty': input.stock_qty or 0,
            'is_active': input.is_active if input.is_active is not None else True,
        }
        
        if input.category_id:
            product_data['category_id'] = input.category_id
            
        product = Product.objects.create(**product_data)
        
        # Handle image upload after creation
        if image is not None:
            product.image = image
            
        product.save()    
        return CreateProduct(product=product)


class UpdateProduct(graphene.Mutation):
    class Arguments:
        input = ProductInput(required=True)
        image = Upload()

    id = graphene.ID()
    product = graphene.Field(ProductType)

    @classmethod
    def mutate(cls, root, info, input, image=None):
        try:
            product = Product.objects.get(id=input.id)

            old_name = product.image.name if product.image else None
            print("Old image name:", old_name)
            print("New image provided:", bool(image))
            print("New image details:", image)
            if image is not None:
                product.image = image
            
            # Update other fields
            product.name = input.name
            product.description = input.description or ''
            product.price = input.price
            product.sku = input.sku or ''
            product.ean = input.ean or ''
            product.ean_carton = input.ean_carton or ''
            product.neta = input.neta or 0
            product.vat = input.vat or 27.00
            product.stock_qty = input.stock_qty or 0
            product.is_active = input.is_active if input.is_active is not None else True
            
            if input.category_id:
                product.category_id = input.category_id
            
            product.save()
            
            if image is not None and old_name and old_name != product.image.name:
                try:
                    default_storage.delete(old_name)
                except Exception as e:
                    print("Error deleting old image:", e)    

            return UpdateProduct(id=product.id, product=product)
        except Product.DoesNotExist:
            return None


class DeleteProduct(graphene.Mutation):
    class Arguments:
        slug = graphene.String(required=True)

    success = graphene.Boolean()
    deactivated = graphene.Boolean()

    def mutate(self, info, slug):
        try:
            product = Product.objects.get(slug=slug)
            
            if product.is_active:
                # Active product -> deactivate
                product.is_active = False
                product.save()
                return DeleteProduct(success=True, deactivated=True)
            else:
                # Inactive product -> delete
                product.delete()
                return DeleteProduct(success=True, deactivated=False)
                
        except Product.DoesNotExist:
            raise Exception("Termék nem található")


class CreateCategory(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)

    category = graphene.Field(CategoryType)
    success = graphene.Boolean()

    @classmethod
    def mutate(cls, root, info, name):
        try:
            category = Category.objects.create(
                name=name,
                slug=slugify(name)
            )
            return CreateCategory(category=category, success=True)
        except Exception as e:
            raise Exception(str(e))


class UpdateCategory(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
        name = graphene.String(required=True)

    category = graphene.Field(CategoryType)
    success = graphene.Boolean()

    @classmethod
    def mutate(cls, root, info, id, name):
        try:
            category = Category.objects.get(id=id)
            category.name = name
            category.slug = slugify(name)
            category.save()
            return UpdateCategory(category=category, success=True)
        except Category.DoesNotExist:
            raise Exception("Kategória nem található")
        except Exception as e:
            raise Exception(str(e))


class DeleteCategory(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)

    success = graphene.Boolean()

    @classmethod
    def mutate(cls, root, info, id):
        try:
            category = Category.objects.get(id=id)
            
            # Check if category has products
            product_count = category.products.count()
            if product_count > 0:
                raise Exception(f"A kategória nem törölhető, mert {product_count} termék tartozik hozzá.")
            
            category.delete()
            return DeleteCategory(success=True)
        except Category.DoesNotExist:
            raise Exception("Kategória nem található")
        except Exception as e:
            raise Exception(str(e))


class CatalogMutation(graphene.ObjectType):
    create_product = CreateProduct.Field()
    update_product = UpdateProduct.Field()
    delete_product = DeleteProduct.Field()
    create_category = CreateCategory.Field()
    update_category = UpdateCategory.Field()
    delete_category = DeleteCategory.Field()
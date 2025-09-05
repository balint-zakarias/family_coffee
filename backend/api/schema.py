import graphene
from graphene_django import DjangoObjectType
from django.db.models import Q,  Sum
from django.conf import settings
from django.utils.text import slugify
from django.core.mail import send_mail

from catalog.models import Category, Product, ProductImage
from orders.models import Order, OrderItem
from contentapp.models import SiteContent, SiteSettings
from contact.models import ContactMessage
from cart.models import Cart, CartItem
from cart.utils import get_or_create_cart

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

class DashboardStatsType(graphene.ObjectType):
    active_products_count = graphene.Int()
    total_orders_count = graphene.Int()
    delivered_orders_revenue = graphene.Decimal()

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

class SiteSettingsType(DjangoObjectType):
    class Meta:
        model = SiteSettings
        fields = ("id", "merchant_order_email", "created_at", "updated_at")

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


class CartItemType(DjangoObjectType):
    class Meta:
        model = CartItem
        fields = ("id", "quantity", "unit_price_snapshot", "line_total", "product")

class CartType(DjangoObjectType):
    subtotal = graphene.Decimal()

    class Meta:
        model = Cart
        fields = ("id", "items", "created_at", "updated_at")

    def resolve_subtotal(self, info):
        return self.subtotal()

class CartSummaryType(graphene.ObjectType):
    count = graphene.Int(required=True)
    subtotal = graphene.Decimal(required=True)

# ============ Input Types ============

class ProductInput(graphene.InputObjectType):
    id = graphene.Int()
    name = graphene.String(required=True)
    description = graphene.String()
    price = graphene.Decimal(required=True)
    imageUrl = graphene.String()
    categoryId = graphene.Int()
    sku = graphene.String(required=True)
    stockQty = graphene.Int(required=True)
    isActive = graphene.Boolean()

# ============ Queries ============

class Query(graphene.ObjectType):
    # Alap
    ping = graphene.String(description="Healthcheck")

    # Tartalom
    site_content = graphene.Field(SiteContentType, description="Nyitóoldal tartalom (singleton)")
    site_settings = graphene.Field(SiteSettingsType, description="Oldal beállítások (singleton)")

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

    # Rendelések
    orders = graphene.List(
        OrderType,
        status=graphene.String(required=False),
        limit=graphene.Int(required=False),
        offset=graphene.Int(required=False),
        description="Rendelések listája szűrőkkel és lapozással",
    )

    # Dashboard statisztikák
    dashboard_stats = graphene.Field(
        DashboardStatsType,
        description="Dashboard statisztikák (termékek, rendelések, bevétel)",
    )

    # Kapcsolat üzenetek
    contact_messages = graphene.List(
        ContactMessageType,
        limit=graphene.Int(required=False),
        offset=graphene.Int(required=False),
        description="Kapcsolat üzenetek listája lapozással",
    )

    cart = graphene.Field(CartType)
    cart_summary = graphene.Field(CartSummaryType)

    def resolve_cart(self, info):
        return get_or_create_cart(info.context)

    def resolve_cart_summary(self, info):
        cart = get_or_create_cart(info.context)
        count = cart.items.aggregate(n=Sum("quantity"))["n"] or 0

        return CartSummaryType(count=count, subtotal=cart.subtotal())

    def resolve_ping(self, info):
        return "pong"

    def resolve_site_content(self, info):
        return SiteContent.objects.first()

    def resolve_site_settings(self, info):
        return SiteSettings.objects.first()

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

    def resolve_orders(self, info, status=None, limit=50, offset=0):
        qs = Order.objects.all().prefetch_related("items__product")
        if status:
            qs = qs.filter(status=status)
        qs = qs.order_by("-created_at")
        return list(qs[offset : offset + (limit or 50)])

    def resolve_dashboard_stats(self, info):
        # Aktív termékek száma
        active_products_count = Product.objects.filter(is_active=True).count()
        
        # Összes rendelés száma
        total_orders_count = Order.objects.count()
        
        # Kiszállított rendelések bevétele
        delivered_orders_revenue = Order.objects.filter(
            status=Order.Status.DELIVERED
        ).aggregate(
            total=Sum('grand_total')
        )['total'] or 0
        
        return DashboardStatsType(
            active_products_count=active_products_count,
            total_orders_count=total_orders_count,
            delivered_orders_revenue=delivered_orders_revenue
        )

    def resolve_contact_messages(self, info, limit=None, offset=None):
        qs = ContactMessage.objects.all()
        offset = offset or 0
        return list(qs[offset : offset + (limit or 50)])

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

class DeleteContactMessage(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()

    def mutate(self, info, id):
        try:
            contact_message = ContactMessage.objects.get(id=id)
            contact_message.delete()
            return DeleteContactMessage(success=True)
        except ContactMessage.DoesNotExist:
            raise Exception("Kapcsolat üzenet nem található.")

class AddToCart(graphene.Mutation):
    class Arguments:
        product_id = graphene.ID(required=True)
        quantity   = graphene.Int(required=True)

    cart = graphene.Field(CartType)

    def mutate(self, info, product_id, quantity):
        cart = get_or_create_cart(info.context)
        product = Product.objects.filter(id=product_id, is_active=True).first()
        if not product:
            raise Exception("A termék nem elérhető.")

        item, created = CartItem.objects.select_for_update().get_or_create(
            cart=cart, product=product,
            defaults={"quantity": max(1, quantity), "unit_price_snapshot": product.price}
        )
        if not created:
            item.quantity = max(1, item.quantity + quantity)
            item.unit_price_snapshot = product.price
        item.save()
        return AddToCart(cart=cart)


class SetQuantity(graphene.Mutation):
    class Arguments:
        item_id  = graphene.ID(required=True)
        quantity = graphene.Int(required=True)

    cart = graphene.Field(CartType)

    def mutate(self, info, item_id, quantity):
        cart = get_or_create_cart(info.context)
        item = CartItem.objects.select_for_update().filter(id=item_id, cart=cart).first()
        if not item:
            raise Exception("Tétel nem található.")

        if quantity <= 0:
            item.delete()
        else:
            item.quantity = quantity
            item.unit_price_snapshot = item.product.price
            item.save()
        return SetQuantity(cart=cart)


class RemoveItem(graphene.Mutation):
    class Arguments:
        item_id = graphene.ID(required=True)

    cart = graphene.Field(CartType)

    def mutate(self, info, item_id):
        cart = get_or_create_cart(info.context)
        CartItem.objects.filter(id=item_id, cart=cart).delete()
        return RemoveItem(cart=cart)

class CreateProduct(graphene.Mutation):
    class Arguments:
        input = ProductInput(required=True)

    id = graphene.Int()
    product = graphene.Field(ProductType)

    def mutate(self, info, input):
        # Generate slug from name
        slug = slugify(input.name)
        counter = 1
        original_slug = slug
        while Product.objects.filter(slug=slug).exists():
            slug = f"{original_slug}-{counter}"
            counter += 1

        product = Product.objects.create(
            name=input.name,
            slug=slug,
            description=input.get('description', ''),
            price=input.price,
            category_id=input.get('categoryId'),
            sku=input.sku,
            stock_qty=input.stockQty,
            is_active=input.get('isActive', True)
        )
        return CreateProduct(id=product.id, product=product)

class UpdateProduct(graphene.Mutation):
    class Arguments:
        slug = graphene.String(required=True)
        input = ProductInput(required=True)

    id = graphene.Int()
    product = graphene.Field(ProductType)

    def mutate(self, info, slug, input):
        try:
            product = Product.objects.get(slug=slug)
        except Product.DoesNotExist:
            raise Exception("Termék nem található")

        product.name = input.name
        product.description = input.get('description', '')
        product.price = input.price
        product.category_id = input.get('categoryId')
        product.sku = input.sku
        product.stock_qty = input.stockQty
        product.is_active = input.get('isActive', True)
        product.save()

        return UpdateProduct(id=product.id, product=product)

class DeleteProduct(graphene.Mutation):
    class Arguments:
        slug = graphene.String(required=True)

    success = graphene.Boolean()
    deactivated = graphene.Boolean()

    def mutate(self, info, slug):
        try:
            product = Product.objects.get(slug=slug)
            
            if product.is_active:
                # Aktív termék -> inaktívvá tesszük
                product.is_active = False
                product.save()
                return DeleteProduct(success=True, deactivated=True)
            else:
                # Inaktív termék -> töröljük
                product.delete()
                return DeleteProduct(success=True, deactivated=False)
                
        except Product.DoesNotExist:
            raise Exception("Termék nem található")

class UpdateOrderStatus(graphene.Mutation):
    class Arguments:
        order_id = graphene.Int(required=True)
        status = graphene.String(required=True)

    order = graphene.Field(OrderType)
    success = graphene.Boolean()

    def mutate(self, info, order_id, status):
        try:
            order = Order.objects.get(id=order_id)
            
            # Validate status
            valid_statuses = [choice[0] for choice in Order.Status.choices]
            if status not in valid_statuses:
                raise Exception(f"Érvénytelen státusz: {status}")
            
            order.status = status
            order.save()
            
            return UpdateOrderStatus(order=order, success=True)
        except Order.DoesNotExist:
            raise Exception("Rendelés nem található")

class OrderInput(graphene.InputObjectType):
    customer_name = graphene.String(required=True)
    customer_email = graphene.String()
    customer_phone = graphene.String(required=True)
    shipping_address = graphene.String(required=True)
    shipping_city = graphene.String(required=True)
    shipping_zip = graphene.String(required=True)
    delivery_notes = graphene.String()
    grand_total = graphene.Decimal(required=True)

class CreateOrder(graphene.Mutation):
    class Arguments:
        input = OrderInput(required=True)

    order = graphene.Field(OrderType)
    success = graphene.Boolean()

    def mutate(self, info, input):
        try:
            # Get cart from session
            cart = get_or_create_cart(info.context)
            
            if not cart.items.exists():
                raise Exception("A kosár üres")
            
            # Calculate totals
            subtotal = sum(item.line_total for item in cart.items.all())
            
            # Create order
            order = Order.objects.create(
                customer_name=input.customer_name,
                customer_email=input.customer_email,
                customer_phone=input.customer_phone,
                shipping_address=input.shipping_address,
                shipping_city=input.shipping_city,
                shipping_zip=input.shipping_zip,
                delivery_notes=input.delivery_notes or "",
                subtotal=subtotal,
                grand_total=subtotal,  # For now, no shipping or discounts
                placed_ip=info.context.META.get('REMOTE_ADDR'),
                placed_user_agent=info.context.META.get('HTTP_USER_AGENT', '')[:300]
            )
            
            # Create order items from cart
            for cart_item in cart.items.all():
                OrderItem.objects.create(
                    order=order,
                    product=cart_item.product,
                    name_snapshot=cart_item.product.name,
                    unit_price_snapshot=cart_item.unit_price_snapshot,
                    quantity=cart_item.quantity,
                    line_total=cart_item.line_total
                )
            
            # Clear cart
            cart.items.all().delete()

            send_mail(
                subject=f"Rendelés visszaigazolás #{order.order_id}",
                message=f"Kedves {order.customer_name},\n\n"
                        f"Köszönjük rendelését! A rendelés azonosítója: {order.order_id}\n"
                        f"Összeg: {order.grand_total} Ft\n\n"
                        "Hamarosan felvesszük Önnel a kapcsolatot.",
                from_email=None,  # DEFAULT_FROM_EMAIL-t használja
                recipient_list=[order.customer_email],
                fail_silently=False,
            )
            
            return CreateOrder(order=order, success=True)
        except Exception as e:
            raise Exception(str(e))

class UpdateSiteSettings(graphene.Mutation):
    class Arguments:
        merchant_order_email = graphene.String()

    site_settings = graphene.Field(SiteSettingsType)
    success = graphene.Boolean()

    def mutate(self, info, merchant_order_email=None):
        try:
            settings, created = SiteSettings.objects.get_or_create(
                defaults={'merchant_order_email': merchant_order_email}
            )
            
            if not created and merchant_order_email is not None:
                settings.merchant_order_email = merchant_order_email
                settings.save()
            
            return UpdateSiteSettings(site_settings=settings, success=True)
        except Exception as e:
            raise Exception(str(e))

class UpdateSiteContent(graphene.Mutation):
    class Arguments:
        hero_title = graphene.String()
        hero_subtitle = graphene.String()
        about_title = graphene.String()
        about_body = graphene.String()

    site_content = graphene.Field(SiteContentType)
    success = graphene.Boolean()

    def mutate(self, info, hero_title=None, hero_subtitle=None, about_title=None, about_body=None):
        try:
            # Get or create the singleton SiteContent
            content, created = SiteContent.objects.get_or_create(
                defaults={
                    'hero_title': hero_title or '',
                    'hero_subtitle': hero_subtitle or '',
                    'about_title': about_title or '',
                    'about_body': about_body or ''
                }
            )
            
            # If not created, update the existing one
            if not created:
                if hero_title is not None:
                    content.hero_title = hero_title
                if hero_subtitle is not None:
                    content.hero_subtitle = hero_subtitle
                if about_title is not None:
                    content.about_title = about_title
                if about_body is not None:
                    content.about_body = about_body
                content.save()
            
            return UpdateSiteContent(site_content=content, success=True)
        except Exception as e:
            raise Exception(str(e))

class CreateCategory(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)

    category = graphene.Field(CategoryType)
    success = graphene.Boolean()

    def mutate(self, info, name):
        try:
            from django.utils.text import slugify
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

    def mutate(self, info, id, name):
        try:
            from django.utils.text import slugify
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

    def mutate(self, info, id):
        try:
            category = Category.objects.get(id=id)
            
            # Check if category has products
            product_count = category.products.count()
            if product_count > 0:
                raise Exception(f"A kategória nem törölhető, mert {product_count} termék tartozik hozzá. Kérjük, helyezze át a termékeket másik kategóriába, mielőtt törölné a kategóriát.")
            
            category.delete()
            return DeleteCategory(success=True)
        except Category.DoesNotExist:
            raise Exception("Kategória nem található")
        except Exception as e:
            raise Exception(str(e))

class Mutation(graphene.ObjectType):
    create_contact_message = CreateContactMessage.Field()
    delete_contact_message = DeleteContactMessage.Field()

    add_to_cart  = AddToCart.Field()
    set_quantity = SetQuantity.Field()
    remove_item  = RemoveItem.Field()

    create_product = CreateProduct.Field()
    update_product = UpdateProduct.Field()
    delete_product = DeleteProduct.Field()
    
    update_order_status = UpdateOrderStatus.Field()
    create_order = CreateOrder.Field()
    update_site_settings = UpdateSiteSettings.Field()
    update_site_content = UpdateSiteContent.Field()
    
    create_category = CreateCategory.Field()
    update_category = UpdateCategory.Field()
    delete_category = DeleteCategory.Field()


schema = graphene.Schema(query=Query, mutation=Mutation)
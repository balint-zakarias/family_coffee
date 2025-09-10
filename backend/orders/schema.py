import graphene
from graphene_django import DjangoObjectType
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.db.models import Sum

from .models import Order, OrderItem
from catalog.models import Product
from cart.utils import get_or_create_cart
from contentapp.models import SiteSettings
import logging
import threading
from django.db import transaction
from django.core.mail import send_mail
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)

def _send_order_emails(order):
    try:
        html_message = render_to_string('orders/order_confirmation_email.html', {'order': order})
        send_mail(
            subject=f"Rendelés visszaigazolás #{order.order_id}",
            message=(
                f"Kedves {order.customer_name},\n\n"
                f"Köszönjük rendelését! Azonosító: {order.order_id}\n"
                f"Összeg: {order.grand_total} Ft\n\n"
                "Hamarosan felvesszük Önnel a kapcsolatot."
            ),
            from_email=None,
            recipient_list=[order.customer_email] if order.customer_email else [],
            html_message=html_message,
            fail_silently=False,
        )

        merchant_order_email = getattr(SiteSettings.objects.first(), "merchant_order_email", None)
        print("##########################MERCHANT EMAIL IS: ", merchant_order_email)
        if merchant_order_email:
            send_mail(
                subject=f"Új rendelés érkezett #{order.order_id}",
                message=(
                    "Új rendelés érkezett.\n\n"
                    f"Rendelés azonosítója: {order.order_id}\n"
                    f"Név: {order.customer_name}\n"
                    f"E-mail: {order.customer_email}\n"
                    f"Telefonszám: {order.customer_phone}\n"
                    f"Összeg: {order.grand_total} Ft\n"
                ),
                from_email=None,
                recipient_list=[merchant_order_email],
                fail_silently=True,
            )
        else:
            logger.warning("No merchant_order_email configured. Order email not sent. Order ID: %s", order.order_id)

    except Exception:
        logger.exception("Order emails failed for order_id=%s", getattr(order, "order_id", "unknown"))

class DashboardStatsType(graphene.ObjectType):
    active_products_count = graphene.Int()
    total_orders_count = graphene.Int()
    delivered_orders_revenue = graphene.Float()


class OrderItemType(DjangoObjectType):
    sku = graphene.String()
    class Meta:
        model = OrderItem
        fields = ("id", "product", "name_snapshot", "unit_price_snapshot", "quantity", "line_total")

    def resolve_sku(self, info):
        return self.product.sku if self.product else None    


class OrderType(DjangoObjectType):
    class Meta:
        model = Order
        fields = (
            "id", "order_id", "customer_name", "customer_email", "customer_phone",
            "shipping_address", "shipping_city", "shipping_zip", "delivery_notes",
            "subtotal", "grand_total", "status", "created_at", "updated_at", "items",
            "billing_address", "billing_city", "billing_zip", "different_delivery_address"
        )


class OrderItemInput(graphene.InputObjectType):
    product_id = graphene.ID(required=True)
    quantity = graphene.Int(required=True)


class OrderInput(graphene.InputObjectType):
    customer_name = graphene.String(required=True)
    customer_email = graphene.String(required=False)
    customer_phone = graphene.String(required=True)
    billing_address = graphene.String(required=True)
    billing_city = graphene.String(required=True)
    billing_zip = graphene.String(required=True)
    shipping_address = graphene.String(required=False)
    shipping_city = graphene.String(required=False)
    shipping_zip = graphene.String(required=False)
    different_delivery_address = graphene.Boolean(required=True)
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
                billing_address=input.billing_address,
                billing_city=input.billing_city,
                billing_zip=input.billing_zip,
                shipping_address=input.shipping_address,
                shipping_city=input.shipping_city,
                shipping_zip=input.shipping_zip,
                different_delivery_address=input.different_delivery_address,
                delivery_notes=input.delivery_notes or "",
                subtotal=subtotal,
                grand_total=subtotal,
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

            # Cart ürítés után, order mentve…
            # Emailezés commit után, háttérszálon (fire-and-forget)
            def _enqueue():
                try:
                    threading.Thread(target=_send_order_emails, args=(order,), daemon=True).start()
                except Exception:
                    logger.exception("Failed to start email thread for order_id=%s", order.order_id)

            transaction.on_commit(_enqueue)

            return CreateOrder(order=order, success=True)
        
        except Exception as e:
            logger.exception("Order creation failed")


class UpdateOrderStatus(graphene.Mutation):
    class Arguments:
        order_id = graphene.String(required=True)
        status = graphene.String(required=True)

    order = graphene.Field(OrderType)
    success = graphene.Boolean()

    def mutate(self, info, order_id, status):
        try:
            order = Order.objects.get(order_id=order_id)
            order.status = status
            order.save()
            return UpdateOrderStatus(order=order, success=True)
        except Order.DoesNotExist:
            raise Exception("Rendelés nem található")


class DashboardActivityType(graphene.ObjectType):
    recent_orders = graphene.List(OrderType)
    recent_messages = graphene.List('contact.schema.ContactMessageType')
    recent_products = graphene.List('catalog.schema.ProductType')


class OrdersQuery(graphene.ObjectType):
    orders = graphene.List(
        OrderType, 
        status=graphene.String(),
        limit=graphene.Int(),
        offset=graphene.Int()
    )
    order = graphene.Field(OrderType, order_id=graphene.String(required=True))
    dashboard_stats = graphene.Field(DashboardStatsType)
    dashboard_activity = graphene.Field(DashboardActivityType)

    def resolve_orders(self, info, status=None, limit=20, offset=0):
        queryset = Order.objects.all().order_by('-created_at')
        if status:
            queryset = queryset.filter(status=status)
        return queryset[offset:offset + limit]

    def resolve_order(self, info, order_id):
        try:
            return Order.objects.get(order_id=order_id)
        except Order.DoesNotExist:
            return None

    def resolve_dashboard_stats(self, info):
        active_products_count = Product.objects.filter(is_active=True).count()
        total_orders_count = Order.objects.count()
        delivered_orders_revenue = Order.objects.filter(status='delivered').aggregate(
            total=Sum('grand_total')
        )['total'] or 0

        return DashboardStatsType(
            active_products_count=active_products_count,
            total_orders_count=total_orders_count,
            delivered_orders_revenue=float(delivered_orders_revenue)
        )


    def resolve_dashboard_activity(self, info):
        from contact.models import ContactMessage
        from catalog.models import Product
        
        return {
            'recent_orders': Order.objects.all().order_by('-created_at')[:5],
            'recent_messages': ContactMessage.objects.all().order_by('-created_at')[:3],
            'recent_products': Product.objects.all().order_by('-created_at')[:3]
        }


class OrdersMutation(graphene.ObjectType):
    create_order = CreateOrder.Field()
    update_order_status = UpdateOrderStatus.Field()

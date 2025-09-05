import graphene
from graphene_django import DjangoObjectType
from django.core.mail import send_mail
from django.template.loader import render_to_string

from .models import Order, OrderItem
from catalog.models import Product
from cart.utils import get_or_create_cart


class OrderItemType(DjangoObjectType):
    class Meta:
        model = OrderItem
        fields = ("id", "product", "name_snapshot", "unit_price_snapshot", "quantity", "line_total")


class OrderType(DjangoObjectType):
    class Meta:
        model = Order
        fields = (
            "id", "order_id", "customer_name", "customer_email", "customer_phone",
            "shipping_address", "shipping_city", "shipping_zip", "delivery_notes",
            "subtotal", "grand_total", "status", "created_at", "updated_at", "items"
        )


class OrderItemInput(graphene.InputObjectType):
    product_id = graphene.ID(required=True)
    quantity = graphene.Int(required=True)


class OrderInput(graphene.InputObjectType):
    customer_name = graphene.String(required=True)
    customer_email = graphene.String(required=True)
    customer_phone = graphene.String(required=True)
    shipping_address = graphene.String(required=True)
    shipping_city = graphene.String(required=True)
    shipping_zip = graphene.String(required=True)
    delivery_notes = graphene.String()
    subtotal = graphene.Decimal(required=True)
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

            # Send confirmation email with HTML template
            html_message = render_to_string('orders/order_confirmation_email.html', {
                'order': order,
            })
            
            send_mail(
                subject=f"Rendelés visszaigazolás #{order.order_id}",
                message=f"Kedves {order.customer_name},\n\n"
                        f"Köszönjük rendelését! A rendelés azonosítója: {order.order_id}\n"
                        f"Összeg: {order.grand_total} Ft\n\n"
                        "Hamarosan felvesszük Önnel a kapcsolatot.",
                from_email=None,
                recipient_list=[order.customer_email],
                html_message=html_message,
                fail_silently=False,
            )
            
            return CreateOrder(order=order, success=True)
        except Exception as e:
            raise Exception(str(e))


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


class OrdersQuery(graphene.ObjectType):
    orders = graphene.List(OrderType)
    order = graphene.Field(OrderType, order_id=graphene.String(required=True))

    def resolve_orders(self, info):
        return Order.objects.all().order_by('-created_at')

    def resolve_order(self, info, order_id):
        try:
            return Order.objects.get(order_id=order_id)
        except Order.DoesNotExist:
            return None


class OrdersMutation(graphene.ObjectType):
    create_order = CreateOrder.Field()
    update_order_status = UpdateOrderStatus.Field()

import graphene
from graphene_django import DjangoObjectType
from django.db.models import Sum

from .models import Cart, CartItem
from .utils import get_or_create_cart
from catalog.models import Product


class CartItemType(DjangoObjectType):
    class Meta:
        model = CartItem
        fields = ("id", "product", "quantity", "unit_price_snapshot", "line_total", "created_at", "updated_at")


class CartType(DjangoObjectType):
    total_items = graphene.Int()
    total_price = graphene.Decimal()
    subtotal = graphene.Decimal()

    class Meta:
        model = Cart
        fields = (
            "id",
            "token",
            "created_at",
            "updated_at",
            "items",
            "total_items",
            "total_price"
        )

    def resolve_total_items(self, info):
        return sum(item.quantity for item in self.items.all())

    def resolve_total_price(self, info):
        return sum(item.line_total for item in self.items.all())
    
    def resolve_subtotal(self, info):
        return self.subtotal()

class CartSummaryType(graphene.ObjectType):
    count = graphene.Int(required=True)
    subtotal = graphene.Decimal(required=True)    


class AddToCart(graphene.Mutation):
    class Arguments:
        product_id = graphene.ID(required=True)
        quantity = graphene.Int(required=True)

    cart = graphene.Field(CartType)
    success = graphene.Boolean()

    def mutate(self, info, product_id, quantity):
        try:
            product = Product.objects.get(id=product_id, is_active=True)
            cart = get_or_create_cart(info.context)
            
            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
                defaults={
                    'quantity': quantity,
                    'unit_price_snapshot': product.price
                }
            )
            
            if not created:
                cart_item.quantity += quantity
                cart_item.save()
            
            return AddToCart(cart=cart, success=True)
        except Product.DoesNotExist:
            raise Exception("Termék nem található")


class UpdateCartItem(graphene.Mutation):
    class Arguments:
        product_id = graphene.ID(required=True)
        quantity = graphene.Int(required=True)

    cart = graphene.Field(CartType)
    success = graphene.Boolean()

    def mutate(self, info, product_id, quantity):
        try:
            cart = get_or_create_cart(info.context)
            cart_item = CartItem.objects.get(cart=cart, product_id=product_id)
            
            if quantity <= 0:
                cart_item.delete()
            else:
                cart_item.quantity = quantity
                cart_item.save()
            
            return UpdateCartItem(cart=cart, success=True)
        except CartItem.DoesNotExist:
            raise Exception("Kosár elem nem található")


class SetQuantity(graphene.Mutation):
    class Arguments:
        item_id = graphene.ID(required=True)
        quantity = graphene.Int(required=True)

    cart = graphene.Field(CartType)
    success = graphene.Boolean()

    def mutate(self, info, item_id, quantity):
        try:
            cart = get_or_create_cart(info.context)
            cart_item = CartItem.objects.get(cart=cart, id=item_id)
            
            if quantity <= 0:
                cart_item.delete()
            else:
                cart_item.quantity = quantity
                cart_item.save()
            
            return SetQuantity(cart=cart, success=True)
        except CartItem.DoesNotExist:
            raise Exception("Kosár elem nem található")


class RemoveFromCart(graphene.Mutation):
    class Arguments:
        product_id = graphene.ID(required=True)

    cart = graphene.Field(CartType)
    success = graphene.Boolean()

    def mutate(self, info, product_id):
        try:
            cart = get_or_create_cart(info.context)
            cart_item = CartItem.objects.get(cart=cart, product_id=product_id)
            cart_item.delete()
            return RemoveFromCart(cart=cart, success=True)
        except CartItem.DoesNotExist:
            raise Exception("Kosár elem nem található")


class ClearCart(graphene.Mutation):
    cart = graphene.Field(CartType)
    success = graphene.Boolean()

    def mutate(self, info):
        cart = get_or_create_cart(info.context)
        cart.items.all().delete()
        return ClearCart(cart=cart, success=True)


class CartQuery(graphene.ObjectType):
    cart = graphene.Field(CartType)

    def resolve_cart(self, info):
        return get_or_create_cart(info.context)

class CartSummaryQuery(graphene.ObjectType):
    cart_summary = graphene.Field(CartSummaryType)

    def resolve_cart_summary(self, info):
        cart = get_or_create_cart(info.context)
        count = cart.items.aggregate(n=Sum("quantity"))["n"] or 0

        return CartSummaryType(count=count, subtotal=cart.subtotal())
    
class CartMutation(graphene.ObjectType):
    add_to_cart = AddToCart.Field()
    update_cart_item = UpdateCartItem.Field()
    set_quantity = SetQuantity.Field()
    remove_from_cart = RemoveFromCart.Field()
    clear_cart = ClearCart.Field()

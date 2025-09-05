import graphene

from catalog.schema import CatalogQuery
from orders.schema import OrdersQuery, OrdersMutation
from cart.schema import CartQuery, CartMutation
from contentapp.schema import ContentQuery, ContentMutation
from contact.schema import ContactQuery, ContactMutation


class Query(
    CatalogQuery,
    OrdersQuery,
    CartQuery,
    ContentQuery,
    ContactQuery,
    graphene.ObjectType
):
    pass


class Mutation(
    OrdersMutation,
    CartMutation,
    ContentMutation,
    ContactMutation,
    graphene.ObjectType
):
    pass


schema = graphene.Schema(query=Query, mutation=Mutation)

import graphene
from graphene_django import DjangoObjectType

from .models import ContactMessage


class ContactMessageType(DjangoObjectType):
    class Meta:
        model = ContactMessage
        fields = ("id", "name", "email", "phone", "message", "handled", "created_at")


class CreateContactMessage(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        email = graphene.String()
        phone = graphene.String()
        message = graphene.String(required=True)

    contact_message = graphene.Field(ContactMessageType)
    success = graphene.Boolean()

    def mutate(self, info, name, message, email=None, phone=None):
        try:
            contact_message = ContactMessage.objects.create(
                name=name,
                email=email,
                phone=phone,
                message=message
            )
            return CreateContactMessage(contact_message=contact_message, success=True)
        except Exception as e:
            raise Exception(str(e))


class DeleteContactMessage(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()

    @classmethod
    def mutate(cls, root, info, id):
        try:
            contact_message = ContactMessage.objects.get(id=id)
            contact_message.delete()
            return DeleteContactMessage(success=True)
        except ContactMessage.DoesNotExist:
            raise Exception("Kapcsolat üzenet nem található")
        except Exception as e:
            raise Exception(str(e))


class ContactQuery(graphene.ObjectType):
    contact_messages = graphene.List(
        ContactMessageType,
        limit=graphene.Int(),
        offset=graphene.Int()
    )

    def resolve_contact_messages(self, info, limit=20, offset=0):
        return ContactMessage.objects.all().order_by('-created_at')[offset:offset + limit]


class ContactMutation(graphene.ObjectType):
    create_contact_message = CreateContactMessage.Field()
    delete_contact_message = DeleteContactMessage.Field()

from django.test import TestCase
from django.contrib.auth.models import User
from graphene.test import Client
from api.schema import schema
from .models import Category, Product


class CatalogIntegrationTest(TestCase):
    def setUp(self):
        self.client = Client(schema)
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            is_staff=True
        )
        self.category = Category.objects.create(
            name='Test Category',
            slug='test-category'
        )
        self.product = Product.objects.create(
            name='Test Product',
            slug='test-product',
            description='Test description',
            price=1000,
            sku='TEST001',
            category=self.category,
            stock_qty=10,
            is_active=True,
            only_for_rent=False
        )

    def test_products_query(self):
        query = '''
        query {
            products {
                id
                name
                slug
                price
                onlyForRent
                isActive
            }
        }
        '''
        result = self.client.execute(query)
        self.assertIsNone(result.get('errors'))
        products = result['data']['products']
        self.assertEqual(len(products), 1)
        self.assertEqual(products[0]['name'], 'Test Product')
        self.assertEqual(products[0]['onlyForRent'], False)

    def test_product_query(self):
        query = '''
        query($slug: String!) {
            product(slug: $slug) {
                id
                name
                description
                price
                onlyForRent
                category {
                    name
                }
            }
        }
        '''
        result = self.client.execute(query, variables={'slug': 'test-product'})
        self.assertIsNone(result.get('errors'))
        product = result['data']['product']
        self.assertEqual(product['name'], 'Test Product')
        self.assertEqual(product['onlyForRent'], False)
        self.assertEqual(product['category']['name'], 'Test Category')

    def test_create_product_mutation(self):
        mutation = '''
        mutation($input: ProductInput!) {
            createProduct(input: $input) {
                product {
                    id
                    name
                    onlyForRent
                }
            }
        }
        '''
        variables = {
            'input': {
                'name': 'New Product',
                'price': 2000,
                'sku': 'NEW001',
                'onlyForRent': True,
                'categoryId': self.category.id
            }
        }
        result = self.client.execute(mutation, variables=variables)
        self.assertIsNone(result.get('errors'))
        product = result['data']['createProduct']['product']
        self.assertEqual(product['name'], 'New Product')
        self.assertEqual(product['onlyForRent'], True)

    def test_rental_product_filtering(self):
        # Create rental product
        Product.objects.create(
            name='Rental Product',
            slug='rental-product',
            price=500,
            sku='RENT001',
            category=self.category,
            only_for_rent=True,
            is_active=True
        )
        
        query = '''
        query {
            products {
                name
                onlyForRent
            }
        }
        '''
        result = self.client.execute(query)
        products = result['data']['products']
        rental_products = [p for p in products if p['onlyForRent']]
        self.assertEqual(len(rental_products), 1)
        self.assertEqual(rental_products[0]['name'], 'Rental Product')

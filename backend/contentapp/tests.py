from django.test import TestCase
from graphene.test import Client
from api.schema import schema
from .models import SiteContent


class ContentIntegrationTest(TestCase):
    def setUp(self):
        self.client = Client(schema)

    def test_site_content_query(self):
        # Create test content
        SiteContent.objects.create(
            id=1,
            hero_title='Test Hero Title',
            hero_subtitle='Test Hero Subtitle',
            about_title='Test About Title',
            about_body='Test about content'
        )

        query = '''
        query {
            siteContent {
                heroTitle
                heroSubtitle
                heroImageUrl
                aboutTitle
                aboutBody
                aboutImageUrl
            }
        }
        '''
        result = self.client.execute(query)
        self.assertIsNone(result.get('errors'))
        content = result['data']['siteContent']
        self.assertEqual(content['heroTitle'], 'Test Hero Title')
        self.assertEqual(content['aboutTitle'], 'Test About Title')

    def test_update_site_content_mutation(self):
        mutation = '''
        mutation($heroTitle: String, $aboutBody: String) {
            updateSiteContent(heroTitle: $heroTitle, aboutBody: $aboutBody) {
                success
                siteContent {
                    heroTitle
                    aboutBody
                }
            }
        }
        '''
        variables = {
            'heroTitle': 'Updated Hero Title',
            'aboutBody': 'Updated about content'
        }
        result = self.client.execute(mutation, variables=variables)
        self.assertIsNone(result.get('errors'))
        
        update_result = result['data']['updateSiteContent']
        self.assertTrue(update_result['success'])
        self.assertEqual(update_result['siteContent']['heroTitle'], 'Updated Hero Title')
        self.assertEqual(update_result['siteContent']['aboutBody'], 'Updated about content')

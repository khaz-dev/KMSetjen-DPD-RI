from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.content.models import Article, Category
from apps.content.constants import KNOWLEDGE_CLUSTER_MAP

User = get_user_model()


class KnowledgeTypeAPITest(TestCase):
    """Test API endpoints for Knowledge Types according to Persekjen No. 8/2026"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='password123'
        )
        self.category = Category.objects.create(
            name_id='Kebijakan Publik',
            name_en='Public Policy',
            slug='kebijakan-publik'
        )

        # Create published articles in various clusters
        self.art_kajian = Article.objects.create(
            title_id='Kajian Strategis Otonomi Daerah',
            title_en='Strategic Study on Regional Autonomy',
            slug='kajian-strategis-otonomi',
            content_id='Isi kajian ilmiah',
            content_en='Scientific study content',
            summary_id='Ringkasan kajian',
            summary_en='Study summary',
            author=self.user,
            category=self.category,
            status='published',
            is_published=True,
            version_type='published',
            access_level='public',
            knowledge_type='kajian'
        )

        self.art_brief = Article.objects.create(
            title_id='Policy Brief Dana Transfer Daerah',
            title_en='Policy Brief on Regional Transfer Funds',
            slug='policy-brief-dana-transfer',
            content_id='Isi policy brief',
            content_en='Policy brief content',
            summary_id='Ringkasan policy brief',
            summary_en='Policy brief summary',
            author=self.user,
            category=self.category,
            status='published',
            is_published=True,
            version_type='published',
            access_level='public',
            knowledge_type='policy_brief'
        )

        self.art_infografis = Article.objects.create(
            title_id='Infografis APBD 2026',
            title_en='Regional Budget 2026 Infographic',
            slug='infografis-apbd-2026',
            content_id='Isi infografis data visual',
            content_en='Visual data infographic content',
            summary_id='Ringkasan infografis',
            summary_en='Infographic summary',
            author=self.user,
            category=self.category,
            status='published',
            is_published=True,
            version_type='published',
            access_level='public',
            knowledge_type='infografis'
        )

    def test_knowledge_types_endpoint(self):
        """Test GET /api/v1/public/knowledge-types/ returns Persekjen No. 8/2026 structure"""
        response = self.client.get('/api/v1/public/knowledge-types/')
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertIn('regulation', data)
        self.assertIn('clusters', data)
        self.assertIsInstance(data['clusters'], list)
        self.assertEqual(len(data['clusters']), 4)

        cluster_map = {c['code']: c for c in data['clusters']}
        self.assertIn('a', cluster_map)
        self.assertIn('b', cluster_map)
        self.assertIn('c', cluster_map)
        self.assertIn('d', cluster_map)

        # Check counts
        self.assertEqual(cluster_map['a']['article_count'], 1)
        self.assertEqual(cluster_map['b']['article_count'], 1)
        self.assertEqual(cluster_map['d']['article_count'], 1)

    def test_filter_articles_by_knowledge_type(self):
        """Test GET /api/v1/public/articles/?knowledge_type=kajian"""
        response = self.client.get('/api/v1/public/articles/', {'knowledge_type': 'kajian'})
        self.assertEqual(response.status_code, 200)
        results = response.json().get('results', [])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['slug'], 'kajian-strategis-otonomi')
        self.assertEqual(results[0]['knowledge_type'], 'kajian')
        self.assertEqual(results[0]['knowledge_cluster'], 'a')
        self.assertIn('knowledge_details', results[0])

    def test_filter_articles_by_knowledge_cluster(self):
        """Test GET /api/v1/public/articles/?knowledge_cluster=b"""
        response = self.client.get('/api/v1/public/articles/', {'knowledge_cluster': 'b'})
        self.assertEqual(response.status_code, 200)
        results = response.json().get('results', [])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['slug'], 'policy-brief-dana-transfer')
        self.assertEqual(results[0]['knowledge_type'], 'policy_brief')
        self.assertEqual(results[0]['knowledge_cluster'], 'b')

    def test_search_articles_by_knowledge_type_keyword(self):
        """Test search query matching knowledge type and cluster synonyms"""
        # Searching "policy brief"
        response = self.client.get('/api/v1/public/articles/', {'search': 'policy brief'})
        self.assertEqual(response.status_code, 200)
        results = response.json().get('results', [])
        self.assertTrue(any(r['slug'] == 'policy-brief-dana-transfer' for r in results))

        # Searching "kajian"
        response2 = self.client.get('/api/v1/public/articles/', {'search': 'kajian'})
        self.assertEqual(response2.status_code, 200)
        results2 = response2.json().get('results', [])
        self.assertTrue(any(r['slug'] == 'kajian-strategis-otonomi' for r in results2))

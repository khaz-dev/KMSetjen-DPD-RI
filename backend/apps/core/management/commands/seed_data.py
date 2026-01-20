"""
Management command to populate the database with seed data for development.
Usage: python manage.py seed_data
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.core.models import User, Role, Language
from apps.content.models import Category, Tag, Article
from django.utils.text import slugify


class Command(BaseCommand):
    help = 'Populate the database with sample data for development'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('[START] Populating database with seed data...'))
        
        # Create languages
        self.create_languages()
        
        # Create roles
        self.create_roles()
        
        # Create users
        users = self.create_users()
        
        # Create categories
        categories = self.create_categories()
        
        # Create tags
        tags = self.create_tags()
        
        # Create articles
        self.create_articles(users, categories, tags)
        
        self.stdout.write(self.style.SUCCESS('[SUCCESS] Database seeding completed successfully!'))

    def create_languages(self):
        """Create supported languages."""
        self.stdout.write('[LNG] Creating languages...')
        
        languages_data = [
            {'code': 'id', 'name': 'Bahasa Indonesia', 'is_default': True, 'is_active': True},
            {'code': 'en', 'name': 'English', 'is_default': False, 'is_active': True},
        ]
        
        for lang_data in languages_data:
            lang, created = Language.objects.get_or_create(
                code=lang_data['code'],
                defaults=lang_data
            )
            status = "[+]" if created else "[-]"
            self.stdout.write(f"  {status} {lang.name}")

    def create_roles(self):
        """Create system roles."""
        self.stdout.write('[ROL] Creating roles...')
        
        roles_data = [
            {
                'code': 'admin',
                'name_id': 'Administrator',
                'name_en': 'Administrator',
                'description_id': 'Pengelola sistem dengan akses penuh',
                'description_en': 'System manager with full access',
                'permissions': ['read', 'write', 'publish', 'review', 'manage_users', 'manage_roles']
            },
            {
                'code': 'editor',
                'name_id': 'Editor',
                'name_en': 'Editor',
                'description_id': 'Penyunting konten yang dapat meninjau dan menerbitkan',
                'description_en': 'Content editor who can review and publish',
                'permissions': ['read', 'write', 'publish', 'review']
            },
            {
                'code': 'contributor',
                'name_id': 'Kontributor',
                'name_en': 'Contributor',
                'description_id': 'Penulis konten yang mengirimkan untuk ditinjau',
                'description_en': 'Content writer who submits for review',
                'permissions': ['read', 'write']
            },
            {
                'code': 'reader',
                'name_id': 'Pembaca',
                'name_en': 'Reader',
                'description_id': 'Pegawai ASN yang hanya dapat membaca konten internal',
                'description_en': 'ASN employee who can only read internal content',
                'permissions': ['read']
            },
            {
                'code': 'public',
                'name_id': 'Publik',
                'name_en': 'Public',
                'description_id': 'Pengguna publik yang dapat membaca konten publik',
                'description_en': 'Public user who can read public content',
                'permissions': ['read_public']
            },
        ]
        
        for role_data in roles_data:
            role, created = Role.objects.get_or_create(
                code=role_data['code'],
                defaults=role_data
            )
            status = "[+]" if created else "[-]"
            self.stdout.write(f"  {status} {role.name_id}")

    def create_users(self):
        """Create sample users."""
        self.stdout.write('[USR] Creating users...')
        
        users_data = [
            {
                'username': 'admin',
                'email': 'admin@kms.local',
                'first_name': 'Admin',
                'last_name': 'System',
                'nip': '199001011990010001',
                'department': 'IT Division',
                'is_staff': True,
                'is_superuser': True,
                'role_code': 'admin',
                'password': 'admin123'
            },
            {
                'username': 'editor1',
                'email': 'editor1@kms.local',
                'first_name': 'Budi',
                'last_name': 'Prasetyo',
                'nip': '199505151995051501',
                'department': 'Content Division',
                'is_staff': True,
                'is_superuser': False,
                'role_code': 'editor',
                'password': 'editor123'
            },
            {
                'username': 'contributor1',
                'email': 'contributor1@kms.local',
                'first_name': 'Siti',
                'last_name': 'Nurhaliza',
                'nip': '199403201994032001',
                'department': 'Public Relations',
                'is_staff': False,
                'is_superuser': False,
                'role_code': 'contributor',
                'password': 'contrib123'
            },
            {
                'username': 'reader1',
                'email': 'reader1@kms.local',
                'first_name': 'Dedi',
                'last_name': 'Gunawan',
                'nip': '199201101992011001',
                'department': 'HR Division',
                'is_staff': False,
                'is_superuser': False,
                'role_code': 'reader',
                'password': 'reader123'
            },
            {
                'username': 'reader2',
                'email': 'reader2@kms.local',
                'first_name': 'Rini',
                'last_name': 'Wijaya',
                'nip': '199306151993061501',
                'department': 'Finance Division',
                'is_staff': False,
                'is_superuser': False,
                'role_code': 'reader',
                'password': 'reader123'
            },
        ]
        
        created_users = {}
        
        for user_data in users_data:
            password = user_data.pop('password')
            role_code = user_data.pop('role_code')
            
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults=user_data
            )
            
            if created:
                user.set_password(password)
                user.save()
            
            # Assign role
            role = Role.objects.get(code=role_code)
            user.roles.add(role)
            
            created_users[user_data['username']] = user
            status = "[+]" if created else "[-]"
            self.stdout.write(f"  {status} {user.get_full_name()} ({role_code})")
        
        return created_users

    def create_categories(self):
        """Create article categories."""
        self.stdout.write('[CAT] Creating categories...')
        
        categories_data = [
            {
                'name_id': 'Kebijakan Publik',
                'name_en': 'Public Policy',
                'slug': 'kebijakan-publik',
                'description_id': 'Kebijakan dan peraturan pemerintah',
                'description_en': 'Government policies and regulations',
                'icon': 'file-text',
                'color': '#007bff',
                'order_index': 1,
                'is_active': True
            },
            {
                'name_id': 'Pengumuman',
                'name_en': 'Announcements',
                'slug': 'pengumuman',
                'description_id': 'Pengumuman penting dan berita terkini',
                'description_en': 'Important announcements and latest news',
                'icon': 'bell',
                'color': '#28a745',
                'order_index': 2,
                'is_active': True
            },
            {
                'name_id': 'Panduan & Tutorial',
                'name_en': 'Guides & Tutorials',
                'slug': 'panduan-tutorial',
                'description_id': 'Panduan penggunaan sistem dan tutorial',
                'description_en': 'System usage guides and tutorials',
                'icon': 'book',
                'color': '#ffc107',
                'order_index': 3,
                'is_active': True
            },
            {
                'name_id': 'Laporan & Evaluasi',
                'name_en': 'Reports & Evaluation',
                'slug': 'laporan-evaluasi',
                'description_id': 'Laporan kinerja dan evaluasi program',
                'description_en': 'Performance reports and program evaluation',
                'icon': 'bar-chart',
                'color': '#dc3545',
                'order_index': 4,
                'is_active': True
            },
            {
                'name_id': 'Berita & Media',
                'name_en': 'News & Media',
                'slug': 'berita-media',
                'description_id': 'Berita dan liputan media',
                'description_en': 'News and media coverage',
                'icon': 'newspaper',
                'color': '#17a2b8',
                'order_index': 5,
                'is_active': True
            },
        ]
        
        created_categories = {}
        
        for cat_data in categories_data:
            category, created = Category.objects.get_or_create(
                slug=cat_data['slug'],
                defaults=cat_data
            )
            created_categories[cat_data['slug']] = category
            status = "[+]" if created else "[-]"
            self.stdout.write(f"  {status} {category.name_id}")
        
        return created_categories

    def create_tags(self):
        """Create article tags."""
        self.stdout.write('[TAG] Creating tags...')
        
        tags_data = [
            {'name_id': 'Penting', 'name_en': 'Important', 'slug': 'penting', 'color': '#dc3545', 'is_active': True},
            {'name_id': 'Regulasi', 'name_en': 'Regulation', 'slug': 'regulasi', 'color': '#0056b3', 'is_active': True},
            {'name_id': 'Pelatihan', 'name_en': 'Training', 'slug': 'pelatihan', 'color': '#ffc107', 'is_active': True},
            {'name_id': 'Berita', 'name_en': 'News', 'slug': 'berita', 'color': '#17a2b8', 'is_active': True},
            {'name_id': 'Tips & Trik', 'name_en': 'Tips & Tricks', 'slug': 'tips-trik', 'color': '#28a745', 'is_active': True},
            {'name_id': 'Teknologi', 'name_en': 'Technology', 'slug': 'teknologi', 'color': '#6f42c1', 'is_active': True},
            {'name_id': 'Manajemen', 'name_en': 'Management', 'slug': 'manajemen', 'color': '#e83e8c', 'is_active': True},
        ]
        
        created_tags = {}
        
        for tag_data in tags_data:
            tag, created = Tag.objects.get_or_create(
                slug=tag_data['slug'],
                defaults=tag_data
            )
            created_tags[tag_data['slug']] = tag
            status = "[+]" if created else "[-]"
            self.stdout.write(f"  {status} {tag.name_id}")
        
        return created_tags

    def create_articles(self, users, categories, tags):
        """Create sample articles."""
        self.stdout.write('[ART] Creating articles...')
        
        articles_data = [
            {
                'title_id': 'Panduan Lengkap Penggunaan Knowledge Management System',
                'title_en': 'Complete Guide to Using Knowledge Management System',
                'content_id': '<h2>Pendahuluan</h2><p>Knowledge Management System (KMS) adalah platform terintegrasi untuk mengelola dan berbagi pengetahuan organisasi.</p>',
                'content_en': '<h2>Introduction</h2><p>Knowledge Management System (KMS) is an integrated platform for managing and sharing organizational knowledge.</p>',
                'summary_id': 'Pelajari cara menggunakan Knowledge Management System dengan panduan lengkap ini.',
                'summary_en': 'Learn how to use the Knowledge Management System with this comprehensive guide.',
                'category_slug': 'panduan-tutorial',
                'tag_slugs': ['pelatihan', 'tips-trik'],
                'author_username': 'editor1',
                'status': 'published',
                'is_published': True,
                'access_level': 'public',
                'published_at': timezone.now() - timedelta(hours=3),
                'view_count': 234,
                'like_count': 45
            },
            {
                'title_id': 'Kebijakan Data Privacy dan Keamanan Informasi',
                'title_en': 'Data Privacy and Information Security Policy',
                'content_id': '<h2>Kebijakan Privacy</h2><p>Organisasi kami berkomitmen untuk melindungi data pribadi semua pengguna.</p>',
                'content_en': '<h2>Privacy Policy</h2><p>Our organization is committed to protecting the personal data of all users.</p>',
                'summary_id': 'Kebijakan penting mengenai privasi data dan keamanan informasi.',
                'summary_en': 'Important policy regarding data privacy and information security.',
                'category_slug': 'kebijakan-publik',
                'tag_slugs': ['penting', 'regulasi'],
                'author_username': 'admin',
                'status': 'published',
                'is_published': True,
                'access_level': 'internal',
                'published_at': timezone.now() - timedelta(hours=12),
                'view_count': 1567,
                'like_count': 89
            },
            {
                'title_id': 'Pengumuman Pembaruan Sistem KMS v2.0',
                'title_en': 'Announcement: KMS System Update v2.0',
                'content_id': '<p>Dengan senang hati kami umumkan peluncuran KMS v2.0 dengan fitur-fitur baru.</p>',
                'content_en': '<p>We are pleased to announce the launch of KMS v2.0 with new features.</p>',
                'summary_id': 'Peluncuran KMS v2.0 dengan peningkatan signifikan.',
                'summary_en': 'Launch of KMS v2.0 with significant improvements.',
                'category_slug': 'pengumuman',
                'tag_slugs': ['berita', 'penting'],
                'author_username': 'editor1',
                'status': 'published',
                'is_published': True,
                'access_level': 'public',
                'published_at': timezone.now() - timedelta(hours=24),
                'view_count': 523,
                'like_count': 156
            },
            {
                'title_id': 'Tips Produktivitas: Manajemen Waktu Efektif',
                'title_en': 'Productivity Tips: Effective Time Management',
                'content_id': '<h2>Strategi Manajemen Waktu</h2><ol><li>Prioritas: Tentukan tugas paling penting</li><li>Jadwal: Alokasikan waktu untuk setiap tugas</li></ol>',
                'content_en': '<h2>Time Management Strategies</h2><ol><li>Priorities: Determine important tasks</li><li>Schedule: Allocate time for each task</li></ol>',
                'summary_id': 'Pelajari strategi manajemen waktu untuk meningkatkan produktivitas kerja.',
                'summary_en': 'Learn time management strategies to increase work productivity.',
                'category_slug': 'panduan-tutorial',
                'tag_slugs': ['tips-trik', 'manajemen'],
                'author_username': 'contributor1',
                'status': 'published',
                'is_published': True,
                'access_level': 'internal',
                'published_at': timezone.now() - timedelta(days=3),
                'view_count': 892,
                'like_count': 267
            },
            {
                'title_id': 'Laporan Evaluasi Program Transformasi Digital Q4 2025',
                'title_en': 'Digital Transformation Program Evaluation Report Q4 2025',
                'content_id': '<h2>Ringkasan Eksekutif</h2><p>Program transformasi digital telah mencapai milestone penting.</p>',
                'content_en': '<h2>Executive Summary</h2><p>Digital transformation has achieved important milestones.</p>',
                'summary_id': 'Laporan evaluasi program transformasi digital kuartal 4 tahun 2025.',
                'summary_en': 'Digital transformation program evaluation report for Q4 2025.',
                'category_slug': 'laporan-evaluasi',
                'tag_slugs': ['teknologi', 'manajemen'],
                'author_username': 'editor1',
                'status': 'published',
                'is_published': True,
                'access_level': 'internal',
                'published_at': timezone.now() - timedelta(days=7),
                'view_count': 445,
                'like_count': 98
            },
            {
                'title_id': 'Berita: Kolaborasi Strategis dengan Universitas Terkemuka',
                'title_en': 'News: Strategic Collaboration with Leading University',
                'content_id': '<p>Kami dengan bangga mengumumkan partnership strategis dengan universitas terkemuka.</p>',
                'content_en': '<p>We are proud to announce a strategic partnership with a leading university.</p>',
                'summary_id': 'Organisasi menjalin kerjasama strategis dengan universitas terkemuka.',
                'summary_en': 'Organization establishes strategic partnership with leading university.',
                'category_slug': 'berita-media',
                'tag_slugs': ['berita', 'penting'],
                'author_username': 'contributor1',
                'status': 'published',
                'is_published': True,
                'access_level': 'public',
                'published_at': timezone.now() - timedelta(days=14),
                'view_count': 678,
                'like_count': 203
            },
        ]
        
        article_count = 0
        for article_data in articles_data:
            category_slug = article_data.pop('category_slug')
            tag_slugs = article_data.pop('tag_slugs')
            author_username = article_data.pop('author_username')
            view_count = article_data.pop('view_count', 10)
            like_count = article_data.pop('like_count', 0)
            
            category = categories.get(category_slug)
            author = users.get(author_username)
            
            article_data['slug'] = slugify(article_data['title_id'])
            
            article, created = Article.objects.get_or_create(
                slug=article_data['slug'],
                defaults={
                    **article_data,
                    'category': category,
                    'author': author,
                    'language': 'id',
                    'is_bilingual': True,
                    'view_count': view_count,
                    'like_count': like_count,
                }
            )
            
            for tag_slug in tag_slugs:
                tag = tags.get(tag_slug)
                if tag:
                    article.tags.add(tag)
            
            article_count += 1
            status = "[+]" if created else "[-]"
            self.stdout.write(f"  {status} {article.title_id} (👁 {view_count}, ❤️ {like_count})")
        
        self.stdout.write(f"  [TOTAL] {article_count} articles")



class Command(BaseCommand):
    help = 'Populate the database with sample data for development'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('[*] Starting database seed...'))
        
        # Create languages
        self.create_languages()
        
        # Create roles
        self.create_roles()
        
        # Create users
        users = self.create_users()
        
        # Create categories
        categories = self.create_categories()
        
        # Create tags
        tags = self.create_tags()
        
        # Create articles
        self.create_articles(users, categories, tags)
        
        self.stdout.write(self.style.SUCCESS('[OK] Database seeding completed successfully!'))

    def create_languages(self):
        """Create supported languages."""
        self.stdout.write('📚 Creating languages...')
        
        languages_data = [
            {'code': 'id', 'name': 'Bahasa Indonesia', 'is_default': True, 'is_active': True},
            {'code': 'en', 'name': 'English', 'is_default': False, 'is_active': True},
        ]
        
        for lang_data in languages_data:
            lang, created = Language.objects.get_or_create(
                code=lang_data['code'],
                defaults=lang_data
            )
            status = "✓ Created" if created else "• Exists"
            self.stdout.write(f"  {status}: {lang.name}")

    def create_roles(self):
        """Create system roles."""
        self.stdout.write('👥 Creating roles...')
        
        roles_data = [
            {
                'code': 'admin',
                'name_id': 'Administrator',
                'name_en': 'Administrator',
                'description_id': 'Pengelola sistem dengan akses penuh',
                'description_en': 'System manager with full access',
                'permissions': ['read', 'write', 'publish', 'review', 'manage_users', 'manage_roles']
            },
            {
                'code': 'editor',
                'name_id': 'Editor',
                'name_en': 'Editor',
                'description_id': 'Penyunting konten yang dapat meninjau dan menerbitkan',
                'description_en': 'Content editor who can review and publish',
                'permissions': ['read', 'write', 'publish', 'review']
            },
            {
                'code': 'contributor',
                'name_id': 'Kontributor',
                'name_en': 'Contributor',
                'description_id': 'Penulis konten yang mengirimkan untuk ditinjau',
                'description_en': 'Content writer who submits for review',
                'permissions': ['read', 'write']
            },
            {
                'code': 'reader',
                'name_id': 'Pembaca',
                'name_en': 'Reader',
                'description_id': 'Pegawai ASN yang hanya dapat membaca konten internal',
                'description_en': 'ASN employee who can only read internal content',
                'permissions': ['read']
            },
            {
                'code': 'public',
                'name_id': 'Publik',
                'name_en': 'Public',
                'description_id': 'Pengguna publik yang dapat membaca konten publik',
                'description_en': 'Public user who can read public content',
                'permissions': ['read_public']
            },
        ]
        
        for role_data in roles_data:
            role, created = Role.objects.get_or_create(
                code=role_data['code'],
                defaults=role_data
            )
            status = "✓ Created" if created else "• Exists"
            self.stdout.write(f"  {status}: {role.name_id}")

    def create_users(self):
        """Create sample users."""
        self.stdout.write('👤 Creating users...')
        
        users_data = [
            {
                'username': 'admin',
                'email': 'admin@kms.local',
                'first_name': 'Admin',
                'last_name': 'System',
                'nip': '199001011990010001',
                'department': 'IT Division',
                'is_staff': True,
                'is_superuser': True,
                'role_code': 'admin',
                'password': 'admin123'
            },
            {
                'username': 'editor1',
                'email': 'editor1@kms.local',
                'first_name': 'Budi',
                'last_name': 'Prasetyo',
                'nip': '199505151995051501',
                'department': 'Content Division',
                'is_staff': True,
                'is_superuser': False,
                'role_code': 'editor',
                'password': 'editor123'
            },
            {
                'username': 'contributor1',
                'email': 'contributor1@kms.local',
                'first_name': 'Siti',
                'last_name': 'Nurhaliza',
                'nip': '199403201994032001',
                'department': 'Public Relations',
                'is_staff': False,
                'is_superuser': False,
                'role_code': 'contributor',
                'password': 'contrib123'
            },
            {
                'username': 'reader1',
                'email': 'reader1@kms.local',
                'first_name': 'Dedi',
                'last_name': 'Gunawan',
                'nip': '199201101992011001',
                'department': 'HR Division',
                'is_staff': False,
                'is_superuser': False,
                'role_code': 'reader',
                'password': 'reader123'
            },
            {
                'username': 'reader2',
                'email': 'reader2@kms.local',
                'first_name': 'Rini',
                'last_name': 'Wijaya',
                'nip': '199306151993061501',
                'department': 'Finance Division',
                'is_staff': False,
                'is_superuser': False,
                'role_code': 'reader',
                'password': 'reader123'
            },
        ]
        
        created_users = {}
        
        for user_data in users_data:
            password = user_data.pop('password')
            role_code = user_data.pop('role_code')
            
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults=user_data
            )
            
            if created:
                user.set_password(password)
                user.save()
            
            # Assign role
            role = Role.objects.get(code=role_code)
            user.roles.add(role)
            
            created_users[user_data['username']] = user
            status = "✓ Created" if created else "• Exists"
            self.stdout.write(f"  {status}: {user.get_full_name()} ({role_code})")
        
        return created_users

    def create_categories(self):
        """Create article categories."""
        self.stdout.write('📁 Creating categories...')
        
        categories_data = [
            {
                'name_id': 'Kebijakan Publik',
                'name_en': 'Public Policy',
                'slug': 'kebijakan-publik',
                'description_id': 'Kebijakan dan peraturan pemerintah',
                'description_en': 'Government policies and regulations',
                'icon': 'file-text',
                'color': '#007bff',
                'order_index': 1,
                'is_active': True
            },
            {
                'name_id': 'Pengumuman',
                'name_en': 'Announcements',
                'slug': 'pengumuman',
                'description_id': 'Pengumuman penting dan berita terkini',
                'description_en': 'Important announcements and latest news',
                'icon': 'bell',
                'color': '#28a745',
                'order_index': 2,
                'is_active': True
            },
            {
                'name_id': 'Panduan & Tutorial',
                'name_en': 'Guides & Tutorials',
                'slug': 'panduan-tutorial',
                'description_id': 'Panduan penggunaan sistem dan tutorial',
                'description_en': 'System usage guides and tutorials',
                'icon': 'book',
                'color': '#ffc107',
                'order_index': 3,
                'is_active': True
            },
            {
                'name_id': 'Laporan & Evaluasi',
                'name_en': 'Reports & Evaluation',
                'slug': 'laporan-evaluasi',
                'description_id': 'Laporan kinerja dan evaluasi program',
                'description_en': 'Performance reports and program evaluation',
                'icon': 'bar-chart',
                'color': '#dc3545',
                'order_index': 4,
                'is_active': True
            },
            {
                'name_id': 'Berita & Media',
                'name_en': 'News & Media',
                'slug': 'berita-media',
                'description_id': 'Berita dan liputan media',
                'description_en': 'News and media coverage',
                'icon': 'newspaper',
                'color': '#17a2b8',
                'order_index': 5,
                'is_active': True
            },
        ]
        
        created_categories = {}
        
        for cat_data in categories_data:
            category, created = Category.objects.get_or_create(
                slug=cat_data['slug'],
                defaults=cat_data
            )
            created_categories[cat_data['slug']] = category
            status = "✓ Created" if created else "• Exists"
            self.stdout.write(f"  {status}: {category.name_id}")
        
        return created_categories

    def create_tags(self):
        """Create article tags."""
        self.stdout.write('🏷️  Creating tags...')
        
        tags_data = [
            {
                'name_id': 'Penting',
                'name_en': 'Important',
                'slug': 'penting',
                'color': '#dc3545',
                'is_active': True
            },
            {
                'name_id': 'Regulasi',
                'name_en': 'Regulation',
                'slug': 'regulasi',
                'color': '#0056b3',
                'is_active': True
            },
            {
                'name_id': 'Pelatihan',
                'name_en': 'Training',
                'slug': 'pelatihan',
                'color': '#ffc107',
                'is_active': True
            },
            {
                'name_id': 'Berita',
                'name_en': 'News',
                'slug': 'berita',
                'color': '#17a2b8',
                'is_active': True
            },
            {
                'name_id': 'Tips & Trik',
                'name_en': 'Tips & Tricks',
                'slug': 'tips-trik',
                'color': '#28a745',
                'is_active': True
            },
            {
                'name_id': 'Teknologi',
                'name_en': 'Technology',
                'slug': 'teknologi',
                'color': '#6f42c1',
                'is_active': True
            },
            {
                'name_id': 'Manajemen',
                'name_en': 'Management',
                'slug': 'manajemen',
                'color': '#e83e8c',
                'is_active': True
            },
        ]
        
        created_tags = {}
        
        for tag_data in tags_data:
            tag, created = Tag.objects.get_or_create(
                slug=tag_data['slug'],
                defaults=tag_data
            )
            created_tags[tag_data['slug']] = tag
            status = "✓ Created" if created else "• Exists"
            self.stdout.write(f"  {status}: {tag.name_id}")
        
        return created_tags

    def create_articles(self, users, categories, tags):
        """Create sample articles."""
        self.stdout.write('📰 Creating articles...')
        
        admin_user = users.get('admin')
        editor_user = users.get('editor1')
        contributor_user = users.get('contributor1')
        
        articles_data = [
            {
                'title_id': 'Panduan Lengkap Penggunaan Knowledge Management System',
                'title_en': 'Complete Guide to Using Knowledge Management System',
                'content_id': '''
                    <h2>Pendahuluan</h2>
                    <p>Knowledge Management System (KMS) adalah platform terintegrasi untuk mengelola dan berbagi pengetahuan organisasi.</p>
                    <h2>Fitur Utama</h2>
                    <ul>
                        <li>Manajemen Artikel</li>
                        <li>Kategorisasi Konten</li>
                        <li>Sistem Tag</li>
                        <li>Kontrol Akses Berbasis Role</li>
                        <li>Audit Trail</li>
                    </ul>
                    <h2>Cara Memulai</h2>
                    <p>Login dengan akun Anda dan jelajahi fitur-fitur yang tersedia.</p>
                ''',
                'content_en': '''
                    <h2>Introduction</h2>
                    <p>Knowledge Management System (KMS) is an integrated platform for managing and sharing organizational knowledge.</p>
                    <h2>Main Features</h2>
                    <ul>
                        <li>Article Management</li>
                        <li>Content Categorization</li>
                        <li>Tagging System</li>
                        <li>Role-Based Access Control</li>
                        <li>Audit Trail</li>
                    </ul>
                    <h2>Getting Started</h2>
                    <p>Login with your account and explore the available features.</p>
                ''',
                'summary_id': 'Pelajari cara menggunakan Knowledge Management System dengan panduan lengkap ini.',
                'summary_en': 'Learn how to use the Knowledge Management System with this comprehensive guide.',
                'category_slug': 'panduan-tutorial',
                'tag_slugs': ['pelatihan', 'tips-trik'],
                'author_username': 'editor1',
                'status': 'published',
                'is_published': True,
                'access_level': 'public',
                'published_at': timezone.now() - timedelta(days=5)
            },
            {
                'title_id': 'Kebijakan Data Privacy dan Keamanan Informasi',
                'title_en': 'Data Privacy and Information Security Policy',
                'content_id': '''
                    <h2>Kebijakan Privacy</h2>
                    <p>Organisasi kami berkomitmen untuk melindungi data pribadi semua pengguna.</p>
                    <h2>Prinsip Utama</h2>
                    <ol>
                        <li>Transparansi dalam pengumpulan data</li>
                        <li>Perlindungan data yang ketat</li>
                        <li>Hak akses dan kontrol pengguna</li>
                    </ol>
                ''',
                'content_en': '''
                    <h2>Privacy Policy</h2>
                    <p>Our organization is committed to protecting the personal data of all users.</p>
                    <h2>Main Principles</h2>
                    <ol>
                        <li>Transparency in data collection</li>
                        <li>Strict data protection</li>
                        <li>User access and control rights</li>
                    </ol>
                ''',
                'summary_id': 'Kebijakan penting mengenai privasi data dan keamanan informasi.',
                'summary_en': 'Important policy regarding data privacy and information security.',
                'category_slug': 'kebijakan-publik',
                'tag_slugs': ['penting', 'regulasi'],
                'author_username': 'admin',
                'status': 'published',
                'is_published': True,
                'access_level': 'internal',
                'published_at': timezone.now() - timedelta(days=3)
            },
            {
                'title_id': 'Pengumuman Pembaruan Sistem KMS v2.0',
                'title_en': 'Announcement: KMS System Update v2.0',
                'content_id': '''
                    <p>Dengan senang hati kami umumkan peluncuran KMS v2.0 dengan fitur-fitur baru yang revolusioner.</p>
                    <h3>Fitur Baru:</h3>
                    <ul>
                        <li>✨ Interface yang lebih intuitif</li>
                        <li>🚀 Performa lebih cepat</li>
                        <li>🔒 Keamanan yang ditingkatkan</li>
                        <li>📱 Kompatibel mobile</li>
                    </ul>
                ''',
                'content_en': '''
                    <p>We are pleased to announce the launch of KMS v2.0 with revolutionary new features.</p>
                    <h3>New Features:</h3>
                    <ul>
                        <li>✨ More intuitive interface</li>
                        <li>🚀 Faster performance</li>
                        <li>🔒 Enhanced security</li>
                        <li>📱 Mobile compatible</li>
                    </ul>
                ''',
                'summary_id': 'Peluncuran KMS v2.0 dengan peningkatan signifikan.',
                'summary_en': 'Launch of KMS v2.0 with significant improvements.',
                'category_slug': 'pengumuman',
                'tag_slugs': ['berita', 'penting'],
                'author_username': 'editor1',
                'status': 'published',
                'is_published': True,
                'access_level': 'public',
                'published_at': timezone.now() - timedelta(days=1)
            },
            {
                'title_id': 'Tips Produktivitas: Manajemen Waktu Efektif',
                'title_en': 'Productivity Tips: Effective Time Management',
                'content_id': '''
                    <h2>Strategi Manajemen Waktu</h2>
                    <ol>
                        <li><strong>Prioritas:</strong> Tentukan tugas paling penting</li>
                        <li><strong>Jadwal:</strong> Alokasikan waktu untuk setiap tugas</li>
                        <li><strong>Fokus:</strong> Hindari gangguan saat bekerja</li>
                        <li><strong>Evaluasi:</strong> Periksa progress secara berkala</li>
                    </ol>
                    <p>Dengan mengikuti strategi ini, Anda dapat meningkatkan produktivitas hingga 40%.</p>
                ''',
                'content_en': '''
                    <h2>Time Management Strategies</h2>
                    <ol>
                        <li><strong>Priorities:</strong> Determine the most important tasks</li>
                        <li><strong>Schedule:</strong> Allocate time for each task</li>
                        <li><strong>Focus:</strong> Avoid distractions while working</li>
                        <li><strong>Evaluate:</strong> Check progress regularly</li>
                    </ol>
                    <p>By following this strategy, you can increase productivity by up to 40%.</p>
                ''',
                'summary_id': 'Pelajari strategi manajemen waktu untuk meningkatkan produktivitas kerja.',
                'summary_en': 'Learn time management strategies to increase work productivity.',
                'category_slug': 'panduan-tutorial',
                'tag_slugs': ['tips-trik', 'manajemen'],
                'author_username': 'contributor1',
                'status': 'published',
                'is_published': True,
                'access_level': 'internal',
                'published_at': timezone.now() - timedelta(days=7)
            },
            {
                'title_id': 'Laporan Evaluasi Program Transformasi Digital Q4 2025',
                'title_en': 'Digital Transformation Program Evaluation Report Q4 2025',
                'content_id': '''
                    <h2>Ringkasan Eksekutif</h2>
                    <p>Program transformasi digital telah mencapai milestone penting dalam kuartal keempat.</p>
                    <h2>Pencapaian Utama</h2>
                    <ul>
                        <li>✓ Implementasi 85% sistem digital</li>
                        <li>✓ Pelatihan 1,500+ karyawan</li>
                        <li>✓ ROI mencapai 120%</li>
                    </ul>
                    <h2>Rekomendasi</h2>
                    <p>Lanjutkan investasi dalam infrastruktur cloud dan AI.</p>
                ''',
                'content_en': '''
                    <h2>Executive Summary</h2>
                    <p>The digital transformation program has achieved important milestones in the fourth quarter.</p>
                    <h2>Main Achievements</h2>
                    <ul>
                        <li>✓ 85% digital system implementation</li>
                        <li>✓ Training 1,500+ employees</li>
                        <li>✓ ROI reached 120%</li>
                    </ul>
                    <h2>Recommendations</h2>
                    <p>Continue investing in cloud infrastructure and AI.</p>
                ''',
                'summary_id': 'Laporan evaluasi program transformasi digital kuartal 4 tahun 2025.',
                'summary_en': 'Digital transformation program evaluation report for Q4 2025.',
                'category_slug': 'laporan-evaluasi',
                'tag_slugs': ['teknologi', 'manajemen'],
                'author_username': 'editor1',
                'status': 'published',
                'is_published': True,
                'access_level': 'internal',
                'published_at': timezone.now() - timedelta(days=10)
            },
            {
                'title_id': 'Berita: Kolaborasi Strategis dengan Universitas Terkemuka',
                'title_en': 'News: Strategic Collaboration with Leading University',
                'content_id': '''
                    <p>Kami dengan bangga mengumumkan partnership strategis dengan universitas terkemuka.</p>
                    <h3>Detail Kolaborasi:</h3>
                    <ul>
                        <li>Program magang untuk 200 mahasiswa per tahun</li>
                        <li>Research & Development bersama</li>
                        <li>Workshop dan seminar reguler</li>
                    </ul>
                ''',
                'content_en': '''
                    <p>We are proud to announce a strategic partnership with a leading university.</p>
                    <h3>Collaboration Details:</h3>
                    <ul>
                        <li>Internship program for 200 students per year</li>
                        <li>Joint Research & Development</li>
                        <li>Regular workshops and seminars</li>
                    </ul>
                ''',
                'summary_id': 'Organisasi menjalin kerjasama strategis dengan universitas terkemuka.',
                'summary_en': 'Organization establishes strategic partnership with leading university.',
                'category_slug': 'berita-media',
                'tag_slugs': ['berita', 'penting'],
                'author_username': 'contributor1',
                'status': 'published',
                'is_published': True,
                'access_level': 'public',
                'published_at': timezone.now() - timedelta(days=15)
            },
        ]
        
        article_count = 0
        for article_data in articles_data:
            # Extract relationships
            category_slug = article_data.pop('category_slug')
            tag_slugs = article_data.pop('tag_slugs')
            author_username = article_data.pop('author_username')
            
            # Get related objects
            category = categories.get(category_slug)
            author = users.get(author_username)
            
            # Generate slug from title
            from django.utils.text import slugify
            article_data['slug'] = slugify(article_data['title_id'])
            
            # Create article
            article, created = Article.objects.get_or_create(
                slug=article_data['slug'],
                defaults={
                    **article_data,
                    'category': category,
                    'author': author,
                    'language': 'id',
                    'is_bilingual': True,
                }
            )
            
            # Add tags
            for tag_slug in tag_slugs:
                tag = tags.get(tag_slug)
                if tag:
                    article.tags.add(tag)
                    tag.usage_count = article.tags.count()
                    tag.save()
            
            # Simulate view counts
            if created:
                article.view_count = 10 + (article_count * 5)
                article.save()
            
            article_count += 1
            status = "✓ Created" if created else "• Exists"
            self.stdout.write(f"  {status}: {article.title_id}")
        
        self.stdout.write(f"  Total articles: {article_count}")

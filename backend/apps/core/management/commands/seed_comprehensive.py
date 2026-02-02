"""
Enhanced management command to populate the database with comprehensive seed data.
Usage: python manage.py seed_comprehensive
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random
from apps.core.models import User, Role, Language
from apps.content.models import Category, Tag, Article
from django.utils.text import slugify


class Command(BaseCommand):
    help = 'Populate the database with comprehensive seed data for development'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('🌱 Starting comprehensive database seed...'))
        
        # Get or create data
        users = self.get_or_create_users()
        categories = self.get_or_create_categories()
        tags = self.get_or_create_tags()
        
        # Create many articles
        self.create_many_articles(users, categories, tags)
        
        self.stdout.write(self.style.SUCCESS('✅ Comprehensive seeding completed!'))

    def get_or_create_users(self):
        """Get or create users."""
        self.stdout.write('👥 Setting up users...')
        
        users_data = [
            {'username': 'admin', 'email': 'admin@kms.local', 'first_name': 'Admin', 'last_name': 'System', 'role': 'admin'},
            {'username': 'editor1', 'email': 'editor1@kms.local', 'first_name': 'Budi', 'last_name': 'Prasetyo', 'role': 'editor'},
            {'username': 'editor2', 'email': 'editor2@kms.local', 'first_name': 'Rina', 'last_name': 'Santoso', 'role': 'editor'},
            {'username': 'contributor1', 'email': 'contrib1@kms.local', 'first_name': 'Siti', 'last_name': 'Nurhaliza', 'role': 'contributor'},
            {'username': 'contributor2', 'email': 'contrib2@kms.local', 'first_name': 'Agus', 'last_name': 'Suryanto', 'role': 'contributor'},
            {'username': 'contributor3', 'email': 'contrib3@kms.local', 'first_name': 'Dewi', 'last_name': 'Lestari', 'role': 'contributor'},
        ]
        
        created_users = {}
        for user_data in users_data:
            role_code = user_data.pop('role')
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults={**user_data, 'nip': f'1990{random.randint(100, 999)}{random.randint(100, 999)}'}
            )
            if created:
                user.set_password('password123')
                user.save()
                role = Role.objects.get(code=role_code)
                user.roles.add(role)
            created_users[user_data['username']] = user
        
        self.stdout.write(f"  ✓ {len(created_users)} users ready")
        return created_users

    def get_or_create_categories(self):
        """Get or create categories."""
        self.stdout.write('📁 Setting up categories...')
        
        categories = Category.objects.all()
        return {cat.slug: cat for cat in categories}

    def get_or_create_tags(self):
        """Get or create tags."""
        self.stdout.write('🏷️  Setting up tags...')
        
        tags = Tag.objects.all()
        return {tag.slug: tag for tag in tags}

    def create_many_articles(self, users, categories, tags):
        """Create many sample articles."""
        self.stdout.write('📰 Creating comprehensive articles...')
        
        articles_data = [
            # POLICY ARTICLES (Kebijakan Publik)
            {
                'title_id': 'Kebijakan Integritas dan Etika Kerja',
                'title_en': 'Integrity and Work Ethics Policy',
                'summary_id': 'Standar perilaku etis dan integritas dalam organisasi.',
                'summary_en': 'Ethical behavior and integrity standards in the organization.',
                'content_id': '<h2>Prinsip Integritas</h2><p>Semua pegawai harus menjunjung tinggi nilai-nilai integritas dalam setiap tindakan.</p>',
                'content_en': '<h2>Integrity Principles</h2><p>All employees must uphold integrity values in every action.</p>',
                'category': 'kebijakan-publik',
                'tags': ['regulasi', 'penting'],
                'author': 'admin',
                'access_level': 'internal',
            },
            {
                'title_id': 'Panduan Manajemen Risiko Organisasi',
                'title_en': 'Organizational Risk Management Guide',
                'summary_id': 'Panduan lengkap untuk mengidentifikasi dan mengelola risiko.',
                'summary_en': 'Complete guide for identifying and managing risks.',
                'content_id': '<h2>Identifikasi Risiko</h2><p>Langkah pertama adalah mengidentifikasi potensi risiko.</p>',
                'content_en': '<h2>Risk Identification</h2><p>The first step is to identify potential risks.</p>',
                'category': 'kebijakan-publik',
                'tags': ['regulasi', 'manajemen'],
                'author': 'editor1',
                'access_level': 'internal',
            },
            {
                'title_id': 'Kebijakan Anti Korupsi dan Gratifikasi',
                'title_en': 'Anti-Corruption and Gratuity Policy',
                'summary_id': 'Kebijakan ketat mengenai pencegahan korupsi dan gratifikasi.',
                'summary_en': 'Strict policy regarding corruption prevention and gratuities.',
                'content_id': '<h2>Larangan Penerimaan Gratifikasi</h2><p>Tidak diperbolehkan menerima hadiah atau gratifikasi.</p>',
                'content_en': '<h2>Gratuity Prohibition</h2><p>No gifts or gratuities are allowed.</p>',
                'category': 'kebijakan-publik',
                'tags': ['penting', 'regulasi'],
                'author': 'admin',
                'access_level': 'public',
            },
            {
                'title_id': 'Kebijakan Perlindungan Pelapor (Whistleblower)',
                'title_en': 'Whistleblower Protection Policy',
                'summary_id': 'Kebijakan perlindungan bagi pelapor pelanggaran.',
                'summary_en': 'Protection policy for whistleblowers.',
                'content_id': '<h2>Perlindungan Hukum</h2><p>Pelapor dilindungi oleh hukum yang berlaku.</p>',
                'content_en': '<h2>Legal Protection</h2><p>Whistleblowers are protected by applicable law.</p>',
                'category': 'kebijakan-publik',
                'tags': ['regulasi'],
                'author': 'editor2',
                'access_level': 'public',
            },
            
            # ANNOUNCEMENTS (Pengumuman)
            {
                'title_id': 'Pengumuman Liburan Resmi Tahun 2026',
                'title_en': 'Announcement: Official Holidays 2026',
                'summary_id': 'Jadwal liburan resmi dan hari libur nasional tahun 2026.',
                'summary_en': 'Schedule of official holidays and national holidays for 2026.',
                'content_id': '<ul><li>Tahun Baru: 1 Januari</li><li>Hari Raya Idul Fitri</li></ul>',
                'content_en': '<ul><li>New Year: January 1</li><li>Eid Fitr Holiday</li></ul>',
                'category': 'pengumuman',
                'tags': ['berita'],
                'author': 'editor1',
                'access_level': 'public',
            },
            {
                'title_id': 'Pengumuman Pemeliharaan Server Sistem Informasi',
                'title_en': 'Announcement: System Server Maintenance',
                'summary_id': 'Jadwal pemeliharaan server untuk upgrade sistem.',
                'summary_en': 'Server maintenance schedule for system upgrade.',
                'content_id': '<p>Server akan dimatikan untuk maintenance pada hari Sabtu pukul 22:00-02:00.</p>',
                'content_en': '<p>Server will be down for maintenance on Saturday at 22:00-02:00.</p>',
                'category': 'pengumuman',
                'tags': ['penting', 'teknologi'],
                'author': 'admin',
                'access_level': 'internal',
            },
            {
                'title_id': 'Pengumuman Rekrutmen Staf Baru',
                'title_en': 'Announcement: New Staff Recruitment',
                'summary_id': 'Pembukaan lowongan untuk posisi-posisi strategis.',
                'summary_en': 'Job openings for strategic positions.',
                'content_id': '<p>Kami membuka lowongan untuk 50 posisi berbeda.</p>',
                'content_en': '<p>We are opening positions for 50 different roles.</p>',
                'category': 'pengumuman',
                'tags': ['berita'],
                'author': 'contributor1',
                'access_level': 'public',
            },
            
            # GUIDES & TUTORIALS (Panduan & Tutorial)
            {
                'title_id': 'Panduan: Cara Membuat Artikel di KMS',
                'title_en': 'Guide: How to Create Articles in KMS',
                'summary_id': 'Tutorial langkah demi langkah untuk membuat artikel.',
                'summary_en': 'Step-by-step tutorial for creating articles.',
                'content_id': '<ol><li>Login ke sistem</li><li>Klik tombol "Buat Artikel"</li></ol>',
                'content_en': '<ol><li>Login to the system</li><li>Click "Create Article" button</li></ol>',
                'category': 'panduan-tutorial',
                'tags': ['pelatihan', 'tips-trik'],
                'author': 'editor1',
                'access_level': 'internal',
            },
            {
                'title_id': 'Tutorial: Menggunakan Fitur Pencarian Lanjutan',
                'title_en': 'Tutorial: Using Advanced Search Feature',
                'summary_id': 'Panduan menggunakan fitur pencarian dengan filter.',
                'summary_en': 'Guide to using search feature with filters.',
                'content_id': '<p>Gunakan operator AND, OR untuk pencarian lebih spesifik.</p>',
                'content_en': '<p>Use AND, OR operators for more specific searches.</p>',
                'category': 'panduan-tutorial',
                'tags': ['pelatihan'],
                'author': 'contributor2',
                'access_level': 'public',
            },
            {
                'title_id': 'Panduan Keamanan Password yang Kuat',
                'title_en': 'Guide to Creating Strong Passwords',
                'summary_id': 'Tips membuat password yang aman dan mudah diingat.',
                'summary_en': 'Tips for creating secure and memorable passwords.',
                'content_id': '<ul><li>Minimal 12 karakter</li><li>Campuran huruf besar dan kecil</li></ul>',
                'content_en': '<ul><li>Minimum 12 characters</li><li>Mix of uppercase and lowercase</li></ul>',
                'category': 'panduan-tutorial',
                'tags': ['tips-trik', 'penting'],
                'author': 'admin',
                'access_level': 'public',
            },
            {
                'title_id': 'Tutorial: Cara Berbagi Dokumen di KMS',
                'title_en': 'Tutorial: How to Share Documents in KMS',
                'summary_id': 'Panduan berbagi dokumen dengan anggota tim.',
                'summary_en': 'Guide to sharing documents with team members.',
                'content_id': '<p>Gunakan fitur "Share" untuk memberikan akses ke tim Anda.</p>',
                'content_en': '<p>Use the "Share" feature to give access to your team.</p>',
                'category': 'panduan-tutorial',
                'tags': ['pelatihan'],
                'author': 'editor2',
                'access_level': 'internal',
            },
            
            # REPORTS & EVALUATION (Laporan & Evaluasi)
            {
                'title_id': 'Laporan Kinerja Departemen IT Q1 2025',
                'title_en': 'IT Department Performance Report Q1 2025',
                'summary_id': 'Evaluasi kinerja departemen IT pada kuartal pertama.',
                'summary_en': 'Evaluation of IT department performance in Q1.',
                'content_id': '<p>Departemen IT telah mencapai 95% uptime sistem.</p>',
                'content_en': '<p>IT department achieved 95% system uptime.</p>',
                'category': 'laporan-evaluasi',
                'tags': ['teknologi', 'manajemen'],
                'author': 'editor1',
                'access_level': 'internal',
            },
            {
                'title_id': 'Laporan Evaluasi Program Pelatihan Karyawan 2025',
                'title_en': 'Employee Training Program Evaluation Report 2025',
                'summary_id': 'Hasil evaluasi program pelatihan dan pengembangan karyawan.',
                'summary_en': 'Results of employee training and development program.',
                'content_id': '<p>3,000 karyawan mengikuti program pelatihan dengan tingkat kepuasan 92%.</p>',
                'content_en': '<p>3,000 employees participated in training with 92% satisfaction rate.</p>',
                'category': 'laporan-evaluasi',
                'tags': ['pelatihan', 'manajemen'],
                'author': 'contributor1',
                'access_level': 'internal',
            },
            {
                'title_id': 'Laporan Analisis Kepuasan Pelanggan 2025',
                'title_en': 'Customer Satisfaction Analysis Report 2025',
                'summary_id': 'Hasil survei kepuasan pelanggan tahun 2025.',
                'summary_en': 'Results of 2025 customer satisfaction survey.',
                'content_id': '<p>Tingkat kepuasan pelanggan meningkat 15% dibanding tahun sebelumnya.</p>',
                'content_en': '<p>Customer satisfaction increased 15% compared to previous year.</p>',
                'category': 'laporan-evaluasi',
                'tags': ['manajemen'],
                'author': 'editor2',
                'access_level': 'public',
            },
            
            # NEWS & MEDIA (Berita & Media)
            {
                'title_id': 'Berita: Organisasi Meraih Penghargaan Inovasi Digital',
                'title_en': 'News: Organization Wins Digital Innovation Award',
                'summary_id': 'Penghargaan internasional untuk program transformasi digital.',
                'summary_en': 'International award for digital transformation program.',
                'content_id': '<p>Kami bangga mengumumkan penghargaan inovasi digital terbaik 2025.</p>',
                'content_en': '<p>We are proud to announce the Best Digital Innovation Award 2025.</p>',
                'category': 'berita-media',
                'tags': ['berita', 'penting'],
                'author': 'contributor2',
                'access_level': 'public',
            },
            {
                'title_id': 'Berita: Kemitraan dengan Platform E-Learning Global',
                'title_en': 'News: Partnership with Global E-Learning Platform',
                'summary_id': 'Kolaborasi dengan platform pembelajaran digital terkemuka.',
                'summary_en': 'Collaboration with leading digital learning platform.',
                'content_id': '<p>Partnership memungkinkan akses ke 10,000+ kursus online.</p>',
                'content_en': '<p>Partnership provides access to 10,000+ online courses.</p>',
                'category': 'berita-media',
                'tags': ['berita', 'teknologi'],
                'author': 'admin',
                'access_level': 'public',
            },
        ]
        
        # Add more articles dynamically
        article_count = 0
        
        for article_data in articles_data:
            category_slug = article_data.pop('category')
            tag_slugs = article_data.pop('tags')
            author_username = article_data.pop('author')
            
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
                    'is_published': True,
                    'status': 'published',
                    'published_at': timezone.now() - timedelta(days=random.randint(1, 30)),
                    'view_count': random.randint(50, 1000),
                    'like_count': random.randint(5, 200),
                }
            )
            
            for tag_slug in tag_slugs:
                tag = tags.get(tag_slug)
                if tag:
                    article.tags.add(tag)
            
            article_count += 1
        
        self.stdout.write(f"  ✓ Created {article_count} articles total")

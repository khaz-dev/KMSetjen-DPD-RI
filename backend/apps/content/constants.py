"""Content app constants."""

# Article Status Choices
ARTICLE_STATUS_DRAFT = 'DRAFT'
ARTICLE_STATUS_REVIEW = 'REVIEW'
ARTICLE_STATUS_APPROVED = 'APPROVED'
ARTICLE_STATUS_REJECTED = 'REJECTED'
ARTICLE_STATUS_PUBLISHED = 'PUBLISHED'
ARTICLE_STATUS_SCHEDULED = 'SCHEDULED'
ARTICLE_STATUS_ARCHIVED = 'ARCHIVED'

ARTICLE_STATUS_CHOICES = [
    (ARTICLE_STATUS_DRAFT, 'Draft'),
    (ARTICLE_STATUS_REVIEW, 'In Review'),
    (ARTICLE_STATUS_APPROVED, 'Approved'),
    (ARTICLE_STATUS_REJECTED, 'Rejected'),
    (ARTICLE_STATUS_PUBLISHED, 'Published'),
    (ARTICLE_STATUS_SCHEDULED, 'Scheduled'),
    (ARTICLE_STATUS_ARCHIVED, 'Archived'),
]

# Access Level Choices
ACCESS_LEVEL_PUBLIC = 'PUBLIC'
ACCESS_LEVEL_INTERNAL = 'INTERNAL'
ACCESS_LEVEL_ROLE_BASED = 'ROLE_BASED'

ACCESS_LEVEL_CHOICES = [
    (ACCESS_LEVEL_PUBLIC, 'Public (Tidak login)'),
    (ACCESS_LEVEL_INTERNAL, 'Internal (Semua ASN)'),
    (ACCESS_LEVEL_ROLE_BASED, 'Role-Based (Peran tertentu)'),
]

# Language Choices
LANGUAGE_INDONESIAN = 'id'
LANGUAGE_ENGLISH = 'en'

LANGUAGE_CHOICES = [
    (LANGUAGE_INDONESIAN, 'Indonesian'),
    (LANGUAGE_ENGLISH, 'English'),
]

# File Type Choices
FILE_TYPE_PDF = 'pdf'
FILE_TYPE_WORD = 'word'
FILE_TYPE_EXCEL = 'excel'
FILE_TYPE_IMAGE = 'image'
FILE_TYPE_TEXT = 'text'
FILE_TYPE_OTHER = 'other'

FILE_TYPE_CHOICES = [
    (FILE_TYPE_PDF, 'PDF'),
    (FILE_TYPE_WORD, 'Word Document'),
    (FILE_TYPE_EXCEL, 'Excel Spreadsheet'),
    (FILE_TYPE_IMAGE, 'Image'),
    (FILE_TYPE_TEXT, 'Text File'),
    (FILE_TYPE_OTHER, 'Other'),
]

# Field Choices
ICON_CHOICES = [
    ('folder', 'Folder'),
    ('document', 'Document'),
    ('news', 'News'),
    ('announcement', 'Announcement'),
    ('policy', 'Policy'),
    ('guide', 'Guide'),
    ('resource', 'Resource'),
    ('other', 'Other'),
]

COLOR_CHOICES = [
    ('#3498db', 'Blue'),
    ('#e74c3c', 'Red'),
    ('#2ecc71', 'Green'),
    ('#f39c12', 'Orange'),
    ('#9b59b6', 'Purple'),
    ('#1abc9c', 'Teal'),
    ('#34495e', 'Dark Gray'),
    ('#95a5a6', 'Light Gray'),
]

# ============================================================================
# BENTUK PENGETAHUAN TERDOKUMENTASI & TERSTANDARDISASI
# Sesuai PERATURAN SEKRETARIS JENDERAL DPD RI NOMOR 8 TAHUN 2026 BAB II PASAL 7
# ============================================================================

# Kode Klaster (Pasal 7 huruf a, b, c, d)
KNOWLEDGE_CLUSTER_A = 'a'  # a. buku, peraturan, kajian, jurnal
KNOWLEDGE_CLUSTER_B = 'b'  # b. ringkasan kebijakan atau policy brief
KNOWLEDGE_CLUSTER_C = 'c'  # c. laporan resmi, buletin, dan artikel Pengetahuan
KNOWLEDGE_CLUSTER_D = 'd'  # d. infografis dan produk audiovisual

# Tipe Bentuk Pengetahuan Granular
KNOWLEDGE_TYPE_BUKU = 'buku'
KNOWLEDGE_TYPE_PERATURAN = 'peraturan'
KNOWLEDGE_TYPE_KAJIAN = 'kajian'
KNOWLEDGE_TYPE_JURNAL = 'jurnal'
KNOWLEDGE_TYPE_POLICY_BRIEF = 'policy_brief'
KNOWLEDGE_TYPE_LAPORAN_RESMI = 'laporan_resmi'
KNOWLEDGE_TYPE_BULETIN = 'buletin'
KNOWLEDGE_TYPE_ARTIKEL = 'artikel'
KNOWLEDGE_TYPE_INFOGRAFIS = 'infografis'
KNOWLEDGE_TYPE_AUDIOVISUAL = 'audiovisual'

KNOWLEDGE_TYPE_CHOICES = [
    # Klaster a: Buku, peraturan, kajian, jurnal
    (KNOWLEDGE_TYPE_BUKU, 'Buku (Klaster a)'),
    (KNOWLEDGE_TYPE_PERATURAN, 'Peraturan (Klaster a)'),
    (KNOWLEDGE_TYPE_KAJIAN, 'Kajian (Klaster a)'),
    (KNOWLEDGE_TYPE_JURNAL, 'Jurnal (Klaster a)'),
    # Klaster b: Ringkasan kebijakan atau policy brief
    (KNOWLEDGE_TYPE_POLICY_BRIEF, 'Ringkasan Kebijakan / Policy Brief (Klaster b)'),
    # Klaster c: Laporan resmi, buletin, dan artikel Pengetahuan
    (KNOWLEDGE_TYPE_LAPORAN_RESMI, 'Laporan Resmi (Klaster c)'),
    (KNOWLEDGE_TYPE_BULETIN, 'Buletin (Klaster c)'),
    (KNOWLEDGE_TYPE_ARTIKEL, 'Artikel Pengetahuan (Klaster c)'),
    # Klaster d: Infografis dan produk audiovisual
    (KNOWLEDGE_TYPE_INFOGRAFIS, 'Infografis (Klaster d)'),
    (KNOWLEDGE_TYPE_AUDIOVISUAL, 'Produk Audiovisual (Klaster d)'),
]

KNOWLEDGE_CLUSTER_CHOICES = [
    (KNOWLEDGE_CLUSTER_A, 'Klaster a: Buku, Peraturan, Kajian, Jurnal'),
    (KNOWLEDGE_CLUSTER_B, 'Klaster b: Ringkasan Kebijakan / Policy Brief'),
    (KNOWLEDGE_CLUSTER_C, 'Klaster c: Laporan Resmi, Buletin, Artikel Pengetahuan'),
    (KNOWLEDGE_CLUSTER_D, 'Klaster d: Infografis dan Produk Audiovisual'),
]

KNOWLEDGE_CLUSTER_MAP = {
    'a': {
        'code': 'a',
        'title_id': 'Buku, Peraturan, Kajian, Jurnal',
        'title_en': 'Books, Regulations, Studies, Journals',
        'pasal_reference': 'Persekjen No. 8/2026 Pasal 7 huruf a',
        'types': [KNOWLEDGE_TYPE_BUKU, KNOWLEDGE_TYPE_PERATURAN, KNOWLEDGE_TYPE_KAJIAN, KNOWLEDGE_TYPE_JURNAL],
        'icon': 'book',
        'color': '#2563eb',
    },
    'b': {
        'code': 'b',
        'title_id': 'Ringkasan Kebijakan (Policy Brief)',
        'title_en': 'Policy Brief',
        'pasal_reference': 'Persekjen No. 8/2026 Pasal 7 huruf b',
        'types': [KNOWLEDGE_TYPE_POLICY_BRIEF],
        'icon': 'file-text',
        'color': '#7c3aed',
    },
    'c': {
        'code': 'c',
        'title_id': 'Laporan Resmi, Buletin, dan Artikel Pengetahuan',
        'title_en': 'Official Reports, Bulletins, and Knowledge Articles',
        'pasal_reference': 'Persekjen No. 8/2026 Pasal 7 huruf c',
        'types': [KNOWLEDGE_TYPE_LAPORAN_RESMI, KNOWLEDGE_TYPE_BULETIN, KNOWLEDGE_TYPE_ARTIKEL],
        'icon': 'layers',
        'color': '#0d9488',
    },
    'd': {
        'code': 'd',
        'title_id': 'Infografis dan Produk Audiovisual',
        'title_en': 'Infographics and Audiovisual Products',
        'pasal_reference': 'Persekjen No. 8/2026 Pasal 7 huruf d',
        'types': [KNOWLEDGE_TYPE_INFOGRAFIS, KNOWLEDGE_TYPE_AUDIOVISUAL],
        'icon': 'activity',
        'color': '#ea580c',
    },
}

KNOWLEDGE_TYPE_DETAILS = {
    KNOWLEDGE_TYPE_BUKU: {
        'name_id': 'Buku',
        'name_en': 'Book',
        'cluster': 'a',
        'cluster_title_id': 'Buku, Peraturan, Kajian, Jurnal',
        'cluster_title_en': 'Books, Regulations, Studies, Journals',
        'pasal_reference': 'Persekjen No. 8/2026 Bab II Pasal 7 huruf a',
        'icon': 'book',
        'color': '#1d4ed8',
    },
    KNOWLEDGE_TYPE_PERATURAN: {
        'name_id': 'Peraturan',
        'name_en': 'Regulation',
        'cluster': 'a',
        'cluster_title_id': 'Buku, Peraturan, Kajian, Jurnal',
        'cluster_title_en': 'Books, Regulations, Studies, Journals',
        'pasal_reference': 'Persekjen No. 8/2026 Bab II Pasal 7 huruf a',
        'icon': 'scale',
        'color': '#0284c7',
    },
    KNOWLEDGE_TYPE_KAJIAN: {
        'name_id': 'Kajian',
        'name_en': 'Study / Research',
        'cluster': 'a',
        'cluster_title_id': 'Buku, Peraturan, Kajian, Jurnal',
        'cluster_title_en': 'Books, Regulations, Studies, Journals',
        'pasal_reference': 'Persekjen No. 8/2026 Bab II Pasal 7 huruf a',
        'icon': 'search',
        'color': '#4338ca',
    },
    KNOWLEDGE_TYPE_JURNAL: {
        'name_id': 'Jurnal',
        'name_en': 'Journal',
        'cluster': 'a',
        'cluster_title_id': 'Buku, Peraturan, Kajian, Jurnal',
        'cluster_title_en': 'Books, Regulations, Studies, Journals',
        'pasal_reference': 'Persekjen No. 8/2026 Bab II Pasal 7 huruf a',
        'icon': 'file-text',
        'color': '#3b82f6',
    },
    KNOWLEDGE_TYPE_POLICY_BRIEF: {
        'name_id': 'Ringkasan Kebijakan (Policy Brief)',
        'name_en': 'Policy Brief',
        'cluster': 'b',
        'cluster_title_id': 'Ringkasan Kebijakan atau Policy Brief',
        'cluster_title_en': 'Policy Brief',
        'pasal_reference': 'Persekjen No. 8/2026 Bab II Pasal 7 huruf b',
        'icon': 'file-text',
        'color': '#7c3aed',
    },
    KNOWLEDGE_TYPE_LAPORAN_RESMI: {
        'name_id': 'Laporan Resmi',
        'name_en': 'Official Report',
        'cluster': 'c',
        'cluster_title_id': 'Laporan Resmi, Buletin, dan Artikel Pengetahuan',
        'cluster_title_en': 'Official Reports, Bulletins, and Knowledge Articles',
        'pasal_reference': 'Persekjen No. 8/2026 Bab II Pasal 7 huruf c',
        'icon': 'bar-chart',
        'color': '#0891b2',
    },
    KNOWLEDGE_TYPE_BULETIN: {
        'name_id': 'Buletin',
        'name_en': 'Bulletin',
        'cluster': 'c',
        'cluster_title_id': 'Laporan Resmi, Buletin, dan Artikel Pengetahuan',
        'cluster_title_en': 'Official Reports, Bulletins, and Knowledge Articles',
        'pasal_reference': 'Persekjen No. 8/2026 Bab II Pasal 7 huruf c',
        'icon': 'newspaper',
        'color': '#059669',
    },
    KNOWLEDGE_TYPE_ARTIKEL: {
        'name_id': 'Artikel Pengetahuan',
        'name_en': 'Knowledge Article',
        'cluster': 'c',
        'cluster_title_id': 'Laporan Resmi, Buletin, dan Artikel Pengetahuan',
        'cluster_title_en': 'Official Reports, Bulletins, and Knowledge Articles',
        'pasal_reference': 'Persekjen No. 8/2026 Bab II Pasal 7 huruf c',
        'icon': 'file-text',
        'color': '#0d9488',
    },
    KNOWLEDGE_TYPE_INFOGRAFIS: {
        'name_id': 'Infografis',
        'name_en': 'Infographic',
        'cluster': 'd',
        'cluster_title_id': 'Infografis dan Produk Audiovisual',
        'cluster_title_en': 'Infographics and Audiovisual Products',
        'pasal_reference': 'Persekjen No. 8/2026 Bab II Pasal 7 huruf d',
        'icon': 'image',
        'color': '#d97706',
    },
    KNOWLEDGE_TYPE_AUDIOVISUAL: {
        'name_id': 'Produk Audiovisual',
        'name_en': 'Audiovisual Product',
        'cluster': 'd',
        'cluster_title_id': 'Infografis dan Produk Audiovisual',
        'cluster_title_en': 'Infographics and Audiovisual Products',
        'pasal_reference': 'Persekjen No. 8/2026 Bab II Pasal 7 huruf d',
        'icon': 'video',
        'color': '#ea580c',
    },
}


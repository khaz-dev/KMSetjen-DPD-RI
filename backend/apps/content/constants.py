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

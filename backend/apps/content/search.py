"""
Comprehensive search utilities for Article model.
Enables full-text search across:
- Title (title_id, title_en)
- Summary / Excerpt (summary_id, summary_en)
- Body Content (content_id, content_en)
- Creator (creator_name, creator_user, creators_data)
- Publisher / Uploader (author, publisher)
- Date (published_at, created_at, with support for Indonesian/English month names, years, etc.)
- Metadata: Category & Tags (name_id, name_en)
- File Attachments (original_filename, description_id, description_en)
"""
import re
from django.db.models import Q, TextField, Value
from django.db.models.functions import Cast, Concat

MONTHS_MAP = {
    # Indonesian
    'januari': 1, 'jan': 1,
    'februari': 2, 'feb': 2,
    'maret': 3, 'mar': 3,
    'april': 4, 'apr': 4,
    'mei': 5,
    'juni': 6, 'jun': 6,
    'juli': 7, 'jul': 7,
    'agustus': 8, 'agu': 8, 'agt': 8,
    'september': 9, 'sep': 9, 'sept': 9,
    'oktober': 10, 'okt': 10,
    'november': 11, 'nov': 11,
    'desember': 12, 'des': 12,
    # English
    'january': 1,
    'february': 2,
    'march': 3,
    'may': 5,
    'june': 6,
    'july': 7,
    'august': 8, 'aug': 8,
    'october': 10, 'oct': 10,
    'december': 12, 'dec': 12,
}


def parse_date_search_q(query_str):
    """
    Parse date-related search queries and return corresponding Q objects
    matching published_at and created_at fields.
    """
    if not query_str:
        return None

    q_str = query_str.strip().lower()

    # 1. Standard ISO or slash/dash formatted dates: YYYY-MM-DD or YYYY/MM/DD
    m_iso = re.match(r'^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$', q_str)
    if m_iso:
        y, mo, d = int(m_iso.group(1)), int(m_iso.group(2)), int(m_iso.group(3))
        if 1 <= mo <= 12 and 1 <= d <= 31:
            return (
                Q(published_at__year=y, published_at__month=mo, published_at__day=d) |
                Q(created_at__year=y, created_at__month=mo, created_at__day=d)
            )

    # 2. DD-MM-YYYY or DD/MM/YYYY
    m_dmy = re.match(r'^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$', q_str)
    if m_dmy:
        d, mo, y = int(m_dmy.group(1)), int(m_dmy.group(2)), int(m_dmy.group(3))
        if 1 <= mo <= 12 and 1 <= d <= 31:
            return (
                Q(published_at__year=y, published_at__month=mo, published_at__day=d) |
                Q(created_at__year=y, created_at__month=mo, created_at__day=d)
            )

    # 3. "DD Month YYYY" (e.g., "6 Oktober 2026", "06 October 2026")
    m_full = re.match(r'^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$', q_str)
    if m_full:
        d = int(m_full.group(1))
        month_word = m_full.group(2)
        y = int(m_full.group(3))
        if month_word in MONTHS_MAP and 1 <= d <= 31:
            mo = MONTHS_MAP[month_word]
            return (
                Q(published_at__year=y, published_at__month=mo, published_at__day=d) |
                Q(created_at__year=y, created_at__month=mo, created_at__day=d)
            )

    # 4. "Month YYYY" (e.g., "Oktober 2026", "October 2026")
    m_my = re.match(r'^([a-zA-Z]+)\s+(\d{4})$', q_str)
    if m_my:
        month_word = m_my.group(1)
        y = int(m_my.group(2))
        if month_word in MONTHS_MAP:
            mo = MONTHS_MAP[month_word]
            return (
                Q(published_at__year=y, published_at__month=mo) |
                Q(created_at__year=y, created_at__month=mo)
            )

    # 5. "DD Month" (e.g., "6 Oktober", "06 Oktober")
    m_dm = re.match(r'^(\d{1,2})\s+([a-zA-Z]+)$', q_str)
    if m_dm:
        d = int(m_dm.group(1))
        month_word = m_dm.group(2)
        if month_word in MONTHS_MAP and 1 <= d <= 31:
            mo = MONTHS_MAP[month_word]
            return (
                Q(published_at__month=mo, published_at__day=d) |
                Q(created_at__month=mo, created_at__day=d)
            )

    # 6. Single month name (e.g. "Oktober", "October", "Okt")
    if q_str in MONTHS_MAP:
        mo = MONTHS_MAP[q_str]
        return (
            Q(published_at__month=mo) |
            Q(created_at__month=mo)
        )

    # 7. Single 4-digit year (e.g. "2026", "2025")
    if q_str.isdigit() and len(q_str) == 4:
        y = int(q_str)
        return (
            Q(published_at__year=y) |
            Q(created_at__year=y)
        )

    return None


def build_article_search_q(term):
    """
    Build a comprehensive Q object matching a single search term across
    all article text and metadata fields.
    """
    q = (
        # Article Title
        Q(title_id__icontains=term) |
        Q(title_en__icontains=term) |

        # Article Excerpt / Summary
        Q(summary_id__icontains=term) |
        Q(summary_en__icontains=term) |

        # Article Content
        Q(content_id__icontains=term) |
        Q(content_en__icontains=term) |

        # Creator (Dibuat oleh)
        Q(creator_name__icontains=term) |
        Q(creator_full_name__icontains=term) |
        Q(creator_user__username__icontains=term) |
        Q(creators_text__icontains=term) |

        # Publisher / Uploader (Diterbitkan oleh)
        Q(author_full_name__icontains=term) |
        Q(author__username__icontains=term) |
        Q(author__email__icontains=term) |
        Q(publisher_full_name__icontains=term) |
        Q(publisher__username__icontains=term) |

        # Category & Tags (article-meta)
        Q(category__name_id__icontains=term) |
        Q(category__name_en__icontains=term) |
        Q(category__description_id__icontains=term) |
        Q(category__description_en__icontains=term) |
        Q(tags__name_id__icontains=term) |
        Q(tags__name_en__icontains=term) |

        # Attachments (article-attachments)
        Q(files__original_filename__icontains=term) |
        Q(files__description_id__icontains=term) |
        Q(files__description_en__icontains=term) |

        # Bentuk Pengetahuan (Persekjen No. 8/2026 Bab II Pasal 7)
        Q(knowledge_type__icontains=term)
    )

    # Bentuk Pengetahuan keywords (Persekjen No. 8/2026 Pasal 7)
    term_lower = term.lower()
    if term_lower in ('buku', 'book', 'books'):
        q |= Q(knowledge_type='buku')
    elif term_lower in ('peraturan', 'regulation', 'regulations'):
        q |= Q(knowledge_type='peraturan')
    elif term_lower in ('kajian', 'study', 'research', 'penelitian'):
        q |= Q(knowledge_type='kajian')
    elif term_lower in ('jurnal', 'journal', 'journals'):
        q |= Q(knowledge_type='jurnal')
    elif term_lower in ('policy', 'brief', 'policy brief', 'policy_brief', 'ringkasan', 'kebijakan', 'ringkasan kebijakan'):
        q |= Q(knowledge_type='policy_brief')
    elif term_lower in ('laporan', 'resmi', 'laporan resmi', 'report', 'official report'):
        q |= Q(knowledge_type='laporan_resmi')
    elif term_lower in ('buletin', 'bulletin', 'buletin pengetahuan'):
        q |= Q(knowledge_type='buletin')
    elif term_lower in ('artikel', 'article', 'artikel pengetahuan'):
        q |= Q(knowledge_type='artikel')
    elif term_lower in ('infografis', 'infografik', 'infographic', 'infographics'):
        q |= Q(knowledge_type='infografis')
    elif term_lower in ('audiovisual', 'audio-visual', 'audio', 'video', 'podcast', 'rekaman'):
        q |= Q(knowledge_type='audiovisual')
    elif term_lower in ('klaster a', 'cluster a', 'klaster_a', 'cluster_a', 'huruf a'):
        q |= Q(knowledge_type__in=['buku', 'peraturan', 'kajian', 'jurnal'])
    elif term_lower in ('klaster b', 'cluster b', 'klaster_b', 'cluster_b', 'huruf b'):
        q |= Q(knowledge_type='policy_brief')
    elif term_lower in ('klaster c', 'cluster c', 'klaster_c', 'cluster_c', 'huruf c'):
        q |= Q(knowledge_type__in=['laporan_resmi', 'buletin', 'artikel'])
    elif term_lower in ('klaster d', 'cluster d', 'klaster_d', 'cluster_d', 'huruf d'):
        q |= Q(knowledge_type__in=['infografis', 'audiovisual'])

    # Access level keywords
    if term_lower in ('publik', 'public'):
        q |= Q(access_level='public')
    elif term_lower == 'internal':
        q |= Q(access_level='internal')
    elif term_lower in ('role', 'role-based', 'role_based'):
        q |= Q(access_level='role_based')

    # Date query matching
    date_q = parse_date_search_q(term)
    if date_q:
        q |= date_q

    return q


def search_articles_queryset(queryset, query_str):
    """
    Search articles queryset across all specified fields:
    - article-title
    - article-excerpt / article-summary
    - article-content
    - meta-name dibuat oleh (creator)
    - meta-name diterbitkan oleh (author/publisher)
    - meta-date-text (published_at / created_at)
    - article-meta mb-3 (category & tags)
    - article-attachments (files original_filename & description)
    """
    if not query_str or not str(query_str).strip():
        return queryset

    query_str = str(query_str).strip()

    # Annotate calculated fields to avoid DB syntax issues with JSONField or name splitting
    qs = queryset.annotate(
        creators_text=Cast('creators_data', TextField()),
        author_full_name=Concat('author__first_name', Value(' '), 'author__last_name'),
        creator_full_name=Concat('creator_user__first_name', Value(' '), 'creator_user__last_name'),
        publisher_full_name=Concat('publisher__first_name', Value(' '), 'publisher__last_name'),
    )

    # 1. Check if the entire query string matches a date pattern (e.g. "6 Oktober 2026")
    full_date_q = parse_date_search_q(query_str)

    tokens = [t for t in query_str.split() if t]

    if len(tokens) <= 1 or full_date_q:
        full_q = build_article_search_q(query_str)
        if full_date_q:
            full_q |= full_date_q
        return qs.filter(full_q).distinct()

    # 2. Multi-word query:
    # A match occurs if:
    # (a) Each token matches at least one field (AND logic across tokens, e.g. "Ruling Markus", "Marcus 2026")
    # OR
    # (b) The whole phrase matches directly in any field
    token_q = Q()
    for token in tokens:
        token_q &= build_article_search_q(token)

    phrase_q = build_article_search_q(query_str)

    return qs.filter(token_q | phrase_q).distinct()

"""
Core app constants.
"""

# Role codes
ROLE_ADMIN = 'admin'
ROLE_EDITOR = 'editor'
ROLE_CONTRIBUTOR = 'contributor'
ROLE_READER = 'reader'
ROLE_PUBLIC = 'public'

ROLE_HIERARCHY = {
    ROLE_ADMIN: 1,
    ROLE_EDITOR: 2,
    ROLE_CONTRIBUTOR: 3,
    ROLE_READER: 4,
    ROLE_PUBLIC: 5,
}

# Language codes
LANGUAGE_ID = 'id'
LANGUAGE_EN = 'en'

LANGUAGE_CODES = (
    (LANGUAGE_ID, 'Bahasa Indonesia'),
    (LANGUAGE_EN, 'English'),
)

#!/usr/bin/env python
"""
Debug script to diagnose the article save issue.
Tests the exact payload that causes the 500 error.
"""
import os
import django
import json
from datetime import datetime

# Configure Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.content.models import Article, Category
from apps.api.v1.internal.serializers import InternalArticleUpdateSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

def test_article_update():
    """Test article update with typical payload."""
    print("\n" + "="*80)
    print("TESTING ARTICLE SAVE/UPDATE ISSUE - SERIALIZER VALIDATION")
    print("="*80)
    
    # Get article to update
    print("\n[1/3] Getting article 27...")
    article = Article.objects.filter(id=27).first()
    if not article:
        print("✗ Article 27 not found!")
        return
    else:
        print(f"✓ Found article {article.id}: {article.title_id}")
        print(f"  - Current status: {repr(article.status)}")
        print(f"  - Current access_level: {repr(article.access_level)}")
    
    # Get test user
    print("\n[2/3] Getting test user...")
    test_user = User.objects.first()
    if not test_user:
        print("✗ No user found!")
        return
    print(f"✓ User: {test_user.username}")
    
    # Get category
    print("\n[3/3] Testing serializer validation...")
    print("-" * 80)
    
    category = article.category
    
    # Test 1: Lowercase values (correct)
    print("\n[TEST 1] Lowercase values (should PASS):")
    payload = {
        'title_id': 'Updated Title',
        'title_en': 'Updated Title EN',
        'content_id': '# Updated Content',
        'content_en': '# Updated Content EN',
        'summary_id': 'Brief summary in Indonesian',
        'summary_en': 'Brief summary in English',
        'category': category.id,
        'status': 'draft',
        'access_level': 'internal',
        'slug': article.slug,
        'tags': []
    }
    print(f"Payload:\n{json.dumps(payload, indent=2)}")
    
    serializer = InternalArticleUpdateSerializer(
        article,
        data=payload,
        partial=True,
        context={'request': type('Request', (), {'user': test_user, 'META': {'HTTP_USER_AGENT': 'test'}})()}
    )
    
    if serializer.is_valid():
        print("✓ Validation PASSED")
        print(f"  Validated data: {json.dumps(serializer.validated_data, indent=2, default=str)}")
    else:
        print("✗ Validation FAILED")
        print(f"  Errors: {json.dumps(serializer.errors, indent=2)}")
    
    # Test 2: Uppercase values (incorrect - this should fail)
    print("\n[TEST 2] Uppercase values (should FAIL):")
    payload = {
        'title_id': 'Updated Title',
        'title_en': 'Updated Title EN',
        'content_id': '# Updated Content',
        'content_en': '# Updated Content EN',
        'summary_id': 'Brief summary in Indonesian',
        'summary_en': 'Brief summary in English',
        'category': category.id,
        'status': 'DRAFT',  # UPPERCASE - WRONG
        'access_level': 'PUBLIC',  # UPPERCASE - WRONG
        'slug': article.slug,
        'tags': []
    }
    print(f"Payload:\n{json.dumps(payload, indent=2)}")
    
    serializer = InternalArticleUpdateSerializer(
        article,
        data=payload,
        partial=True,
        context={'request': type('Request', (), {'user': test_user, 'META': {'HTTP_USER_AGENT': 'test'}})()}
    )
    
    if serializer.is_valid():
        print("✓ Validation PASSED (unexpected!)")
    else:
        print("✗ Validation FAILED (expected)")
        print(f"  Errors: {json.dumps(serializer.errors, indent=2)}")
    
    # Test 3: Mixed cases
    print("\n[TEST 3] Other field values (checking for issues):")
    bad_payloads = [
        ('Empty status', {'status': ''}),
        ('None status', {'status': None}),
        ('Invalid status', {'status': 'invalid_status'}),
        ('Invalid access_level', {'access_level': 'invalid_level'}),
    ]
    
    for test_name, extra_fields in bad_payloads:
        payload = {
            'title_id': 'Updated Title',
            'category': category.id,
        }
        payload.update(extra_fields)
        
        serializer = InternalArticleUpdateSerializer(
            article,
            data=payload,
            partial=True,
            context={'request': type('Request', (), {'user': test_user, 'META': {'HTTP_USER_AGENT': 'test'}})()}
        )
        
        if serializer.is_valid():
            print(f"  ✓ {test_name}: PASSED")
        else:
            print(f"  ✗ {test_name}: FAILED")
            print(f"    Errors: {json.dumps(serializer.errors, indent=2)}")
    
    print("\n" + "="*80)
    print("DEBUG COMPLETE")
    print("="*80 + "\n")

if __name__ == '__main__':
    try:
        test_article_update()
    except Exception as e:
        print(f"\n✗ ERROR: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()


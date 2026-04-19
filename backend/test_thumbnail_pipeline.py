import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.api.v1.internal.pptx_endpoints import FileViewSet
from apps.files.models import File
from django.test import RequestFactory
import json
import base64

# Find the file
try:
    file_obj = File.objects.filter(id=21).first()
    if file_obj:
        print(f"File found: {file_obj.original_filename}")
        print(f"File path: {file_obj.file.path}")
        print(f"File exists: {os.path.exists(file_obj.file.path)}")
        
        # Test the thumbnails_all endpoint
        factory = RequestFactory()
        request = factory.get('/api/v1/internal/articles/35/files/21/thumbnails_all/')
        
        viewset = FileViewSet()
        viewset.request = request
        viewset.format_kwarg = None
        viewset.kwargs = {'article_id': 35, 'pk': 21}
        
        response = viewset.thumbnails_all(request, article_id=35, pk=21)
        
        print(f"\n✓ Response status: {response.status_code}")
        print(f"✓ Response data keys: {list(response.data.keys())}")
        print(f"✓ Total slides: {response.data.get('total_slides')}")
        print(f"✓ Thumbnails count: {len(response.data.get('thumbnails', []))}")
        
        # Check first thumbnail
        if response.data.get('thumbnails'):
            first_thumb = response.data['thumbnails'][0]
            print(f"✓ First thumbnail slide: {first_thumb.get('slide')}")
            thumb_data = first_thumb.get('thumbnail', '')
            print(f"✓ First thumbnail type: {type(thumb_data)}")
            print(f"✓ First thumbnail length: {len(thumb_data)} chars")
            print(f"✓ First thumbnail starts with: {thumb_data[:80]}")
            
            # Verify it's valid base64
            try:
                if thumb_data.startswith('data:image/png;base64,'):
                    base64_part = thumb_data.split(',')[1]
                    decoded = base64.b64decode(base64_part)
                    print(f"✓ Base64 is valid - decoded size: {len(decoded)} bytes")
                    # Comparing as bytes
                    is_png = decoded[:8] == b'\x89PNG\r\n\x1a\n'
                    print(f"✓ PNG signature valid: {is_png}")
            except Exception as e:
                print(f"✗ Base64 decode error: {e}")
    else:
        print("File not found!")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

#!/usr/bin/env python
"""Test CORS headers from backend API using urllib"""
import urllib.request
import urllib.error
import json

# Test GET request with Origin header from localhost:5175
headers = {
    'Origin': 'http://localhost:5175',
    'User-Agent': 'CORSTest/1.0',
}

print("=" * 70)
print("Testing CORS Headers from Backend API")
print("=" * 70)
print(f"\nRequest Headers: {json.dumps(headers, indent=2)}")

try:
    # Create request with headers
    url = 'http://localhost:8002/api/v1/public/articles/popular/'
    print(f"\nMaking GET request to: {url}")
    
    req = urllib.request.Request(url, headers=headers)
    response = urllib.request.urlopen(req, timeout=10)
    
    print(f"\n✓ Status Code: {response.status}")
    print("\nResponse Headers (CORS-related):")
    
    cors_headers = {
        k: v for k, v in response.headers.items() 
        if 'access-control' in k.lower() or 'cors' in k.lower()
    }
    
    if cors_headers:
        for header, value in cors_headers.items():
            print(f"  {header}: {value}")
    else:
        print("  [No CORS headers found] ⚠️")
    
    # Show all response headers
    print("\nAll Response Headers:")
    for header, value in response.headers.items():
        print(f"  {header}: {value}")
    
    # Read response body
    content = response.read()
    print(f"\n✓ Response Length: {len(content)} bytes")
    
    # Try to parse response
    try:
        data = json.loads(content.decode('utf-8'))
        print(f"✓ Data parsed successfully (first 300 chars): {json.dumps(data, indent=2)[:300]}...")
    except:
        print(f"✓ Response body (first 300 chars): {content.decode('utf-8', errors='ignore')[:300]}...")

except urllib.error.HTTPError as e:
    print(f"\n✗ HTTP Error {e.code}: {e.reason}")
    print("\nResponse Headers:")
    for header, value in e.headers.items():
        print(f"  {header}: {value}")
except Exception as e:
    print(f"\n✗ Error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 70)

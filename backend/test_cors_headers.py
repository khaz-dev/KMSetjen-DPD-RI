#!/usr/bin/env python
"""Test CORS headers from backend API"""
import requests
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
    # Test the popular articles endpoint
    url = 'http://localhost:8002/api/v1/public/articles/popular/'
    print(f"\nMaking GET request to: {url}")
    
    response = requests.get(url, headers=headers, timeout=10, verify=False)
    
    print(f"\n✓ Status Code: {response.status_code}")
    print("\nResponse Headers (CORS-related):")
    cors_headers = {
        k: v for k, v in response.headers.items() 
        if 'access-control' in k.lower() or 'cors' in k.lower()
    }
    
    if cors_headers:
        for header, value in cors_headers.items():
            print(f"  {header}: {value}")
    else:
        print("  [No CORS headers found]")
    
    # Show all response headers
    print("\nAll Response Headers:")
    for header, value in response.headers.items():
        print(f"  {header}: {value}")
    
    print(f"\n✓ Response Length: {len(response.content)} bytes")
    print(f"✓ Content Type: {response.headers.get('Content-Type', 'Not specified')}")
    
    # Try to parse response
    if response.headers.get('Content-Type', '').startswith('application/json'):
        data = response.json()
        print(f"✓ Data: {json.dumps(data, indent=2)[:200]}...")

except Exception as e:
    print(f"\n✗ Error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 70)

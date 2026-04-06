#!/usr/bin/env python
"""Direct HTTP socket test"""
import socket
import json

print("=" * 70)
print("Direct HTTP Socket Test")
print("=" * 70)

try:
    # Create socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.connect(('127.0.0.1', 8002))
    
    # Send HTTP request
    request = (
        "GET /api/v1/public/articles/popular/ HTTP/1.1\r\n"
        "Host: localhost:8002\r\n"
        "Origin: http://localhost:5175\r\n"
        "Connection: close\r\n"
        "\r\n"
    )
    
    print("Sending request:")
    print(request)
    
    sock.sendall(request.encode())
    
    # Receive response
    response = b""
    while True:
        chunk = sock.recv(4096)
        if not chunk:
            break
        response += chunk
    
    sock.close()
    
    # Parse response
    response_str = response.decode('utf-8', errors='ignore')
    lines = response_str.split('\r\n')
    
    print("Response Status Line:")
    print(f"  {lines[0]}")
    
    print("\nAll Response Headers:")
    headers_section = True
    for line in lines[1:]:
        if line == "":
            headers_section = False
            break
        print(f"  {line}")
    
    if not any('access-control' in line.lower() for line in lines[1:]):
        print("  [No CORS headers found]")
    
    # Check content
    headers_end = response_str.find('\r\n\r\n')
    if headers_end > 0:
        body = response_str[headers_end + 4:500]
        print(f"\nResponse Body (first 300 chars):")
        print(f"  {body}")

except Exception as e:
    print(f"✗ Error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 70)

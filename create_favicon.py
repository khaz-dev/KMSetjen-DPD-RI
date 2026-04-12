#!/usr/bin/env python3
"""
Create a minimal favicon.ico file for the frontend/public directory
"""
import struct
from pathlib import Path

def create_minimal_ico(filepath):
    """Create a minimal 16x16 ICO file with a simple color"""
    # ICO file format:
    # - Header: 6 bytes (reserved, type, count)
    # - Directory entry: 16 bytes (width, height, colors, reserved, color planes, bits per pixel, size, offset)
    # - Image data: BITMAPINFOHEADER + pixel data
    
    ico_path = Path(filepath)
    
    # Minimal ICO: 16x16 pixel, 24-bit color
    # Header: reserved(2) + type(2) + count(2) = 6 bytes
    # Directory: width(1) + height(1) + colors(1) + reserved(1) + color_planes(2) + bits_per_pixel(2) + data_size(4) + data_offset(4) = 16 bytes
    # Total header: 22 bytes
    # BITMAPINFOHEADER: 40 bytes
    # Minimal pixel data for 16x16 at 24-bit: 16*16*3 = 768 bytes + AND mask = 32 bytes (aligned) = 800 bytes
    
    # Build ICO file
    ico_data = bytearray()
    
    # ICO Header
    ico_data.extend(struct.pack('<HHH', 0, 1, 1))  # reserved, type (1=icon), count (1 image)
    
    # Directory Entry
    image_data_size = 40 + (16 * 16 * 3) + (16 * 2)  # BITMAPINFOHEADER + pixel data + AND mask
    image_data_offset = 6 + 16  # After header and directory
    
    ico_data.extend(struct.pack('<BBBBHHII',
        16,           # width
        16,           # height
        0,            # color count (0 = no palette)
        0,            # reserved
        1,            # color planes
        24,           # bits per pixel
        image_data_size,       # size of image data
        image_data_offset      # offset to image data
    ))
    
    # BITMAPINFOHEADER
    ico_data.extend(struct.pack('<I', 40))       # header size
    ico_data.extend(struct.pack('<i', 16))       # width
    ico_data.extend(struct.pack('<i', 32))       # height (doubled for ICO format)
    ico_data.extend(struct.pack('<H', 1))        # color planes
    ico_data.extend(struct.pack('<H', 24))       # bits per pixel
    ico_data.extend(struct.pack('<I', 0))        # compression (none)
    ico_data.extend(struct.pack('<I', 0))        # image size
    ico_data.extend(struct.pack('<i', 0))        # horizontal resolution
    ico_data.extend(struct.pack('<i', 0))        # vertical resolution
    ico_data.extend(struct.pack('<I', 0))        # colors used
    ico_data.extend(struct.pack('<I', 0))        # important colors
    
    # Simple pixel data: light blue color (RGB: 100, 150, 200)
    for i in range(16 * 16):
        ico_data.extend(struct.pack('<BBB', 200, 150, 100))  # BGR format for BMP/ICO
    
    # AND mask (all zeros = fully opaque)
    for i in range(16 * 2):  # 32 bytes for 16x16 AND mask (1 bit per pixel)
        ico_data.append(0)
    
    # Write file
    ico_path.write_bytes(bytes(ico_data))
    print(f"Created minimal favicon.ico at {ico_path} ({len(ico_data)} bytes)")

if __name__ == '__main__':
    import sys
    target = sys.argv[1] if len(sys.argv) > 1 else 'favicon.ico'
    create_minimal_ico(target)

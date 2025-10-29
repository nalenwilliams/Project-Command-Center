#!/usr/bin/env python3
"""Optimize logo for email embedding"""
from PIL import Image
import base64
import io

# Open and optimize the logo
img = Image.open('/app/frontend/public/williams-logo.png')

# Resize to smaller dimensions
img.thumbnail((120, 120), Image.Resampling.LANCZOS)

# Save to bytes with optimization
output = io.BytesIO()
img.save(output, format='PNG', optimize=True, quality=50)
output.seek(0)

# Convert to base64
img_base64 = base64.b64encode(output.read()).decode('utf-8')

print(f"Original size: {len(open('/app/frontend/public/williams-logo.png', 'rb').read())} bytes")
print(f"Optimized size: {len(output.getvalue())} bytes")
print(f"Base64 length: {len(img_base64)} characters")
print(f"\nOptimized base64 string:")
print(f"data:image/png;base64,{img_base64}")

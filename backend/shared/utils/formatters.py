"""Formatting utilities."""
from datetime import datetime


def format_file_size(size_bytes):
    """Format bytes to human-readable file size."""
    if not size_bytes:
        return "0 B"
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f}{unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f}TB"


def format_date(date_obj, format_str='%Y-%m-%d'):
    """Format date object to string."""
    if isinstance(date_obj, datetime):
        return date_obj.strftime(format_str)
    return str(date_obj)


def truncate_text(text, max_length=100, suffix='...'):
    """Truncate text to max length."""
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix

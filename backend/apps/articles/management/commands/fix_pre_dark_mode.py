#!/usr/bin/env python
"""
Django management command to fix pre element styling for dark mode.
"""
import re
from django.core.management.base import BaseCommand
from apps.articles.models import Article


class Command(BaseCommand):
    help = 'Fix pre element inline styles to include explicit text color for dark mode'

    def fix_pre_styling(self, content):
        """
        Fix pre element inline styles to include explicit text color.
        Replaces: <pre style="background-color: #f4f4f4; padding: 12px; ...">
        With:     <pre style="background-color: #f4f4f4; color: #212529; padding: 12px; ...">
        """
        if not content:
            return content
            
        pattern = r'<pre\s+style="([^"]*background-color:\s*#f4f4f4[^"]*)"'
        
        def replacer(match):
            style_attr = match.group(1)
            
            # Check if color is already defined
            if 'color:' in style_attr:
                return match.group(0)  # Already has color, skip
            
            # Add color after background-color
            new_style = style_attr.replace(
                'background-color: #f4f4f4',
                'background-color: #f4f4f4; color: #212529'
            )
            return f'<pre style="{new_style}"'
        
        return re.sub(pattern, replacer, content, flags=re.IGNORECASE)

    def handle(self, *args, **options):
        articles = Article.objects.filter(id__in=[1, 2, 3, 4, 5, 6])
        
        total_fixed = 0
        
        for article in articles:
            original_id = article.content_id
            original_en = article.content_en
            
            # Fix Indonesian content
            fixed_id = self.fix_pre_styling(original_id)
            
            # Fix English content
            fixed_en = self.fix_pre_styling(original_en)
            
            # Count pre elements
            pre_count_id = len(re.findall(r'<pre\s+style=["\']([^"\']*background-color:\s*#f4f4f4[^"\']*)["\']', fixed_id, re.IGNORECASE))
            pre_count_en = len(re.findall(r'<pre\s+style=["\']([^"\']*background-color:\s*#f4f4f4[^"\']*)["\']', fixed_en, re.IGNORECASE))
            
            # Apply changes
            if fixed_id != original_id or fixed_en != original_en:
                article.content_id = fixed_id
                article.content_en = fixed_en
                article.save()
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Article {article.id} ({article.title_en})'),
                    ending='\n'
                )
                self.stdout.write(f'   - Indonesian: Updated')
                self.stdout.write(f'   - English: Updated')
                total_fixed += 1
            else:
                self.stdout.write(f'⏭️  Article {article.id}: No changes needed')
        
        self.stdout.write(
            self.style.SUCCESS(f'\n✨ Complete! {total_fixed} articles updated with dark mode pre styling.')
        )

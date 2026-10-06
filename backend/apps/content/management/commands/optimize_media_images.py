"""
Management command to optimize all existing media images in the KMSetjen DPD RI project.
Converts large PNG/JPEG files to high-efficiency WebP, downscales to appropriate display resolutions,
updates database references, and removes the old bulky files from disk.
"""
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.core.models import User
from apps.content.models import Article, Category
from shared.utils.image_optimizer import (
    optimize_image_file,
    MAX_SIZE_AVATAR,
    MAX_SIZE_CATEGORY,
    MAX_SIZE_ARTICLE
)


class Command(BaseCommand):
    help = 'Optimize all existing media images (Articles, Categories, Avatars) to lightweight WebP format.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simulate optimization without writing changes to disk or database.'
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        if dry_run:
            self.stdout.write(self.style.WARNING("Running in DRY-RUN mode. No files or records will be modified."))

        total_original_bytes = 0
        total_optimized_bytes = 0
        processed_count = 0

        # -------------------------------------------------------------
        # 1. OPTIMIZE USER AVATARS
        # -------------------------------------------------------------
        self.stdout.write(self.style.MIGRATE_HEADING("\n[1/3] Processing User Avatars..."))
        users = User.objects.filter(avatar__isnull=False).exclude(avatar='')
        for user in users:
            try:
                old_field = user.avatar
                old_path = os.path.join(settings.MEDIA_ROOT, old_field.name)
                if not os.path.exists(old_path):
                    continue

                old_size = os.path.getsize(old_path)
                total_original_bytes += old_size

                with open(old_path, 'rb') as f:
                    optimized_file = optimize_image_file(f, max_size=MAX_SIZE_AVATAR, quality=82)

                new_size = len(optimized_file.read())
                optimized_file.seek(0)
                total_optimized_bytes += new_size
                processed_count += 1

                savings_pct = (1 - (new_size / old_size)) * 100 if old_size > 0 else 0
                self.stdout.write(
                    f"  User {user.username}: {old_field.name} ({old_size/1024:.1f} KB) "
                    f"-> ({new_size/1024:.1f} KB) [-{savings_pct:.1f}%]"
                )

                if not dry_run:
                    base, _ = os.path.splitext(old_field.name)
                    new_rel_path = f"{base}.webp"
                    new_full_path = os.path.join(settings.MEDIA_ROOT, new_rel_path)

                    # Save new webp file
                    with open(new_full_path, 'wb') as out_f:
                        out_f.write(optimized_file.read())

                    # Update User model without triggering double save hook
                    User.objects.filter(id=user.id).update(avatar=new_rel_path)

                    # Remove old file if path changed
                    if old_path != new_full_path and os.path.exists(old_path):
                        try:
                            os.remove(old_path)
                        except Exception as e:
                            self.stderr.write(f"  Warning: Could not remove old file {old_path}: {e}")

            except Exception as err:
                self.stderr.write(f"  Error processing avatar for user {user.username}: {err}")

        # -------------------------------------------------------------
        # 2. OPTIMIZE CATEGORY IMAGES
        # -------------------------------------------------------------
        self.stdout.write(self.style.MIGRATE_HEADING("\n[2/3] Processing Category Images..."))
        categories = Category.objects.filter(image__isnull=False).exclude(image='')
        for cat in categories:
            try:
                old_field = cat.image
                old_path = os.path.join(settings.MEDIA_ROOT, old_field.name)
                if not os.path.exists(old_path):
                    continue

                old_size = os.path.getsize(old_path)
                total_original_bytes += old_size

                with open(old_path, 'rb') as f:
                    optimized_file = optimize_image_file(f, max_size=MAX_SIZE_CATEGORY, quality=82)

                new_size = len(optimized_file.read())
                optimized_file.seek(0)
                total_optimized_bytes += new_size
                processed_count += 1

                savings_pct = (1 - (new_size / old_size)) * 100 if old_size > 0 else 0
                self.stdout.write(
                    f"  Category '{cat.name_id}': {old_field.name} ({old_size/1024:.1f} KB) "
                    f"-> ({new_size/1024:.1f} KB) [-{savings_pct:.1f}%]"
                )

                if not dry_run:
                    base, _ = os.path.splitext(old_field.name)
                    new_rel_path = f"{base}.webp"
                    new_full_path = os.path.join(settings.MEDIA_ROOT, new_rel_path)

                    with open(new_full_path, 'wb') as out_f:
                        out_f.write(optimized_file.read())

                    Category.objects.filter(id=cat.id).update(image=new_rel_path)

                    if old_path != new_full_path and os.path.exists(old_path):
                        try:
                            os.remove(old_path)
                        except Exception as e:
                            self.stderr.write(f"  Warning: Could not remove old file {old_path}: {e}")

            except Exception as err:
                self.stderr.write(f"  Error processing category '{cat.name_id}': {err}")

        # -------------------------------------------------------------
        # 3. OPTIMIZE ARTICLE FEATURED IMAGES
        # -------------------------------------------------------------
        self.stdout.write(self.style.MIGRATE_HEADING("\n[3/3] Processing Article Images..."))
        articles = Article.objects.filter(image__isnull=False).exclude(image='')
        
        # Track already converted paths so duplicate references don't re-read deleted files
        converted_paths = {}

        for art in articles:
            try:
                old_field = art.image
                old_rel = old_field.name
                old_path = os.path.join(settings.MEDIA_ROOT, old_rel)

                if old_rel in converted_paths:
                    # Already converted this exact file
                    new_rel = converted_paths[old_rel]
                    if not dry_run:
                        Article.objects.filter(id=art.id).update(image=new_rel)
                    self.stdout.write(f"  Article {art.id}: re-used optimized {new_rel}")
                    continue

                if not os.path.exists(old_path):
                    continue

                old_size = os.path.getsize(old_path)
                total_original_bytes += old_size

                with open(old_path, 'rb') as f:
                    optimized_file = optimize_image_file(f, max_size=MAX_SIZE_ARTICLE, quality=82)

                new_size = len(optimized_file.read())
                optimized_file.seek(0)
                total_optimized_bytes += new_size
                processed_count += 1

                savings_pct = (1 - (new_size / old_size)) * 100 if old_size > 0 else 0
                self.stdout.write(
                    f"  Article {art.id} ({art.title_id[:25]}...): {old_rel} ({old_size/1024:.1f} KB) "
                    f"-> ({new_size/1024:.1f} KB) [-{savings_pct:.1f}%]"
                )

                base, _ = os.path.splitext(old_rel)
                new_rel_path = f"{base}.webp"
                new_full_path = os.path.join(settings.MEDIA_ROOT, new_rel_path)
                converted_paths[old_rel] = new_rel_path

                if not dry_run:
                    with open(new_full_path, 'wb') as out_f:
                        out_f.write(optimized_file.read())

                    Article.objects.filter(id=art.id).update(image=new_rel_path)

                    if old_path != new_full_path and os.path.exists(old_path):
                        try:
                            os.remove(old_path)
                        except Exception as e:
                            self.stderr.write(f"  Warning: Could not remove old file {old_path}: {e}")

            except Exception as err:
                self.stderr.write(f"  Error processing article {art.id}: {err}")

        # -------------------------------------------------------------
        # SUMMARY
        # -------------------------------------------------------------
        total_savings = total_original_bytes - total_optimized_bytes
        total_savings_pct = (total_savings / total_original_bytes * 100) if total_original_bytes > 0 else 0

        self.stdout.write(self.style.SUCCESS("\n" + "="*60))
        self.stdout.write(self.style.SUCCESS("OPTIMIZATION SUMMARY:"))
        self.stdout.write(f"Total images processed: {processed_count}")
        self.stdout.write(f"Original total size:    {total_original_bytes/1024/1024:.2f} MB")
        self.stdout.write(f"Optimized total size:   {total_optimized_bytes/1024/1024:.2f} MB")
        self.stdout.write(self.style.SUCCESS(
            f"Space & bandwidth saved:{total_savings/1024/1024:.2f} MB ({total_savings_pct:.1f}% reduction!)"
        ))
        self.stdout.write(self.style.SUCCESS("="*60 + "\n"))

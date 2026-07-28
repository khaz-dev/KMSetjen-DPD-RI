"""
Management command to update admin user credentials

Usage: 
  python manage.py update_admin_credentials --username=sdmadmin --email=sdm@dpd.go.id --password=sdmselaludihati!
  python manage.py update_admin_credentials  # Uses defaults
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Update admin user credentials'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            default='sdmadmin',
            help='New username for admin user (default: sdmadmin)'
        )
        parser.add_argument(
            '--email',
            type=str,
            default='sdm@dpd.go.id',
            help='New email for admin user (default: sdm@dpd.go.id)'
        )
        parser.add_argument(
            '--password',
            type=str,
            default='sdmselaludihati!',
            help='New password for admin user (default: sdmselaludihati!)'
        )
        parser.add_argument(
            '--first-name',
            type=str,
            default='SDM',
            help='First name (default: SDM)'
        )
        parser.add_argument(
            '--last-name',
            type=str,
            default='Admin',
            help='Last name (default: Admin)'
        )

    def handle(self, *args, **options):
        username = options['username']
        email = options['email']
        password = options['password']
        first_name = options['first_name']
        last_name = options['last_name']

        self.stdout.write(
            self.style.WARNING('\n[START] Updating admin credentials...\n')
        )

        # Try to find existing admin user
        admin_user = (
            User.objects.filter(username=username).first()
            or User.objects.filter(username='admin').first()
            or User.objects.filter(email=email).first()
            or User.objects.filter(is_superuser=True).first()
        )

        if not admin_user:
            self.stdout.write(self.style.WARNING('[WARN] No existing admin user found. Creating new superuser...'))
            try:
                admin_user = User.objects.create_superuser(
                    username=username,
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name
                )
                self.stdout.write(
                    self.style.SUCCESS(f'[OK] Created new admin superuser: {username}')
                )
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'[FAIL] Failed to create admin user: {e}'))
                return
        else:
            # Update existing admin user
            self.stdout.write(f'\nUpdating admin user credentials and permissions...\n')
            
            old_username = admin_user.username
            old_email = admin_user.email
            
            admin_user.username = username
            admin_user.email = email
            admin_user.first_name = first_name
            admin_user.last_name = last_name
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.is_active = True
            admin_user.set_password(password)
            admin_user.save()
            
            self.stdout.write(
                self.style.SUCCESS(f'  [OK] Username: {old_username} -> {username}')
            )
            self.stdout.write(
                self.style.SUCCESS(f'  [OK] Email: {old_email} -> {email}')
            )
            self.stdout.write(
                self.style.SUCCESS(f'  [OK] Name: {first_name} {last_name}')
            )
            self.stdout.write(
                self.style.SUCCESS(f'  [OK] Staff / Superuser / Active: True')
            )
            self.stdout.write(
                self.style.SUCCESS(f'  [OK] Password: updated')
            )

        # Ensure admin role assignment
        try:
            from apps.core.models import Role
            admin_role = Role.objects.filter(code='admin').first()
            if admin_role:
                admin_user.roles.add(admin_role)
                self.stdout.write(self.style.SUCCESS(f'  [OK] Assigned admin role'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'  [WARN] Could not assign admin role: {e}'))

        # Display final status
        self.stdout.write(f'\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('[SUCCESS] Admin credentials updated!'))
        self.stdout.write('='*60)
        self.stdout.write(f'\nAdmin Login Credentials:')
        self.stdout.write(f'  Username (Nama pengguna): {admin_user.username}')
        self.stdout.write(f'  Email: {admin_user.email}')
        self.stdout.write(f'  Password (Sandi): {password}')
        self.stdout.write(f'\nLogin URL (Local): http://localhost:8002/admin/login/')
        self.stdout.write(f'Login URL (Staging): https://kms-be.khaz.app/admin/login/')
        self.stdout.write('\n')

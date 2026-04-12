"""
Create or update Django admin superuser with secure credentials.
Usage: python manage.py create_admin --username khaz_prod --password YourSecurePassword123!
       python manage.py create_admin --generate
"""
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
import secrets
import string

User = get_user_model()

class Command(BaseCommand):
    help = 'Create or update Django admin superuser with secure credentials'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            default=None,
            help='Username for admin (default: khaz_prod)',
        )
        parser.add_argument(
            '--email',
            type=str,
            default=None,
            help='Email for admin (default: khairilazmiashari@gmail.com)',
        )
        parser.add_argument(
            '--password',
            type=str,
            default=None,
            help='Password for admin (if not provided, will generate random secure password)',
        )
        parser.add_argument(
            '--generate',
            action='store_true',
            help='Generate and display a secure random password',
        )

    def handle(self, *args, **options):
        username = options.get('username') or 'khaz_prod'
        email = options.get('email') or 'khairilazmiashari@gmail.com'
        password = options.get('password')
        
        # Generate password if requested
        if options.get('generate') and not password:
            password = self.generate_secure_password()
            self.stdout.write(
                self.style.WARNING(f'Generated secure password: {password}')
            )
        
        # If no password provided and not generating
        if not password:
            raise CommandError(
                'Password required. Provide --password or use --generate flag'
            )
        
        # Create or update user
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        
        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(
                self.style.SUCCESS(f'✓ Admin user created: {username}')
            )
        else:
            user.email = email
            user.is_staff = True
            user.is_superuser = True
            user.set_password(password)
            user.save()
            self.stdout.write(
                self.style.SUCCESS(f'✓ Admin user updated: {username}')
            )
        
        # Display credentials
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.WARNING('ADMIN CREDENTIALS:'))
        self.stdout.write(f'Username: {username}')
        self.stdout.write(f'Email: {email}')
        self.stdout.write(f'Password: {password}')
        self.stdout.write('='*60 + '\n')
        
        self.stdout.write(
            self.style.SUCCESS('✓ Admin user ready. URL: https://khaz.app/kms/admin/')
        )

    @staticmethod
    def generate_secure_password(length=16):
        """Generate a secure random password."""
        characters = string.ascii_letters + string.digits + '!@#$%^&*'
        password = ''.join(secrets.choice(characters) for _ in range(length))
        return password

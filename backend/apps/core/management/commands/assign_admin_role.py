"""
Management command to assign admin role to a user by email

Usage: python manage.py assign_admin_role khairilazmiashari@gmail.com
"""
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from apps.core.models import Role

User = get_user_model()

class Command(BaseCommand):
    help = 'Assign ADMIN role to a user by email'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Email of user to assign role to')

    def handle(self, *args, **options):
        email = options['email']
        
        self.stdout.write(self.style.WARNING(f'\n[START] Assigning ADMIN role to {email}...'))
        
        # Find user
        try:
            user = User.objects.get(email=email)
            self.stdout.write(self.style.SUCCESS(f'✓ Found user: {user.email}'))
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'✗ User {email} not found'))
            self.stdout.write(self.style.WARNING('\nAvailable users:'))
            for u in User.objects.all():
                self.stdout.write(f'  - {u.email}')
            raise CommandError(f'User with email {email} does not exist')
        
        # Get admin role
        try:
            admin_role = Role.objects.get(code='admin')
            self.stdout.write(self.style.SUCCESS(f'✓ Found role: {admin_role.code} ({admin_role.name_id})'))
        except Role.DoesNotExist:
            raise CommandError('ADMIN role not found in database')
        
        # Check if already has role
        if user.roles.filter(code='admin').exists():
            self.stdout.write(self.style.WARNING(f'⚠ User already has ADMIN role'))
        else:
            # Assign role
            user.roles.add(admin_role)
            self.stdout.write(self.style.SUCCESS(f'✓ Assigned ADMIN role to {user.email}'))
        
        # Show all roles
        user_roles = list(user.roles.values_list('code', flat=True))
        self.stdout.write(self.style.SUCCESS(f'✓ User roles: {user_roles}'))
        self.stdout.write(self.style.SUCCESS('\n[SUCCESS] Role assignment completed!\n'))

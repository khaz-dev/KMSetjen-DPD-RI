"""
Custom Django runserver command that defaults to port 8002.

This command overrides django.contrib.staticfiles' runserver to ensure
the backend always runs on port 8002 by default.

Priority: apps.core comes before django.contrib.staticfiles in INSTALLED_APPS,
so this command is loaded first.
"""

import os
from django.core.management.commands.runserver import Command as BaseCommand


class Command(BaseCommand):
    """
    Custom runserver that defaults to port 8002.
    
    Environment Variables:
        BACKEND_PORT: Override default port (default: 8002)
    
    Usage:
        python manage.py runserver              # Uses 0.0.0.0:8002
        python manage.py runserver 8001         # Uses 0.0.0.0:8001
        BACKEND_PORT=9000 python manage.py runserver  # Uses 0.0.0.0:9000
    """
    
    def add_arguments(self, parser):
        super().add_arguments(parser)
        parser.add_argument(
            '--port',
            type=int,
            default=None,
            help='Port to run the server on (default: 8002)',
        )
    
    def handle(self, *args, **options):
        # Get port from environment variable or default to 8002
        backend_port = os.environ.get('BACKEND_PORT', '8002')
        
        # If no addrport was provided as positional argument
        if not options.get('addrport'):
            # Set the address and port
            options['addrport'] = f'0.0.0.0:{backend_port}'
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'[OK] Custom runserver command loaded'
                )
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f'[OK] Backend running on port: {backend_port}'
                )
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f'[OK] URL: http://0.0.0.0:{backend_port}'
                )
            )
        
        # Call the parent handle method
        return super().handle(*args, **options)

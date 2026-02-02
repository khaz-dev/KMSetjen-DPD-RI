import os
from django.core.management.commands.runserver import Command as BaseCommand


class Command(BaseCommand):
    """Custom runserver that uses BACKEND_PORT environment variable."""
    
    def add_arguments(self, parser):
        super().add_arguments(parser)
    
    def handle(self, *args, **options):
        # Check for BACKEND_PORT environment variable
        backend_port = os.environ.get('BACKEND_PORT', '8002')
        
        # Set default address and port if not provided
        if not options.get('addrport'):
            options['addrport'] = f'0.0.0.0:{backend_port}'
            self.stdout.write(
                self.style.SUCCESS(f'[INFO] Using BACKEND_PORT={backend_port} from environment')
            )
        
        return super().handle(*args, **options)

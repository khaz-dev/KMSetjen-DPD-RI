from django.apps import AppConfig


class ContentConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.content'
    verbose_name = 'Content Management'
    
    def ready(self):
        """Register signals when app is ready."""
        from apps.content import signals
        signals.register_article_signals()
        signals.register_category_signals()


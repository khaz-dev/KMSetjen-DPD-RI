#!/usr/bin/env python
from django.contrib.auth import get_user_model
from apps.core.models import Role, Language

User = get_user_model()
user_count = User.objects.count()
role_count = Role.objects.count()
lang_count = Language.objects.count()

print(f"Users: {user_count}")
print(f"Roles: {role_count}")
print(f"Languages: {lang_count}")

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class User(AbstractUser):
    ACCOUNT_TYPE_CHOICES = [
        ("personal", "Personal"),
        ("business", "Business"),
    ]

    AUTH_PROVIDER_CHOICES = [
        ("email", "Email"),
        ("google", "Google"),
    ]

    name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    account_type = models.CharField(
        max_length=20,
        choices=ACCOUNT_TYPE_CHOICES,
        default="personal"
    )
    auth_provider = models.CharField(
        max_length=20,
        choices=AUTH_PROVIDER_CHOICES,
        default="email"
    )

    def __str__(self):
        return self.username
    

class PendingRegistration(models.Model):
    ACCOUNT_TYPE_CHOICES = User.ACCOUNT_TYPE_CHOICES

    name = models.CharField(max_length=150)
    username = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    account_type = models.CharField(
        max_length=20,
        choices=ACCOUNT_TYPE_CHOICES,
        default="personal"
    )

    verification_code_hash = models.CharField(max_length=128)
    verification_expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.verification_expires_at

    def __str__(self):
        return self.email
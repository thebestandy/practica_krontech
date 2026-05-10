import secrets
import string
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, PendingRegistration


def generate_verification_code(length=6):
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    account_type = serializers.ChoiceField(
        choices=User.ACCOUNT_TYPE_CHOICES,
        default="personal"
    )

    def validate(self, data):
        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError("Parolele nu coincid.")

        if User.objects.filter(email=data["email"]).exists():
            raise serializers.ValidationError("Există deja un cont cu acest email.")

        if User.objects.filter(username=data["username"]).exists():
            raise serializers.ValidationError("Există deja un cont cu acest username.")

        validate_password(data["password"])

        return data

    def create(self, validated_data):
        validated_data.pop("confirm_password")

        email = validated_data["email"]
        username = validated_data["username"]

        
        PendingRegistration.objects.filter(email=email).delete()
        PendingRegistration.objects.filter(username=username).delete()

        code = generate_verification_code()

        pending = PendingRegistration.objects.create(
            name=validated_data["name"],
            username=username,
            email=email,
            password=make_password(validated_data["password"]),
            account_type=validated_data.get("account_type", "personal"),
            verification_code_hash=make_password(code),
            verification_expires_at=timezone.now() + timedelta(minutes=15),
        )

        send_mail(
            subject="Cod de verificare E-scraps.",
            message=f"Codul tău de verificare este: {code}. Codul expiră în 15 minute.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )

        return pending


class VerifyEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)

    def validate(self, data):
        email = data["email"]
        code = data["code"]

        try:
            pending = PendingRegistration.objects.get(email=email)
        except PendingRegistration.DoesNotExist:
            raise serializers.ValidationError("Nu există o înregistrare în așteptare pentru acest email.")

        if pending.is_expired():
            pending.delete()
            raise serializers.ValidationError("Codul a expirat. Te rugăm să te înregistrezi din nou.")

        if not check_password(code, pending.verification_code_hash):
            raise serializers.ValidationError("Cod invalid.")

        if User.objects.filter(email=pending.email).exists():
            pending.delete()
            raise serializers.ValidationError("Există deja un cont cu acest email.")

        if User.objects.filter(username=pending.username).exists():
            pending.delete()
            raise serializers.ValidationError("Există deja un cont cu acest username.")

        data["pending"] = pending
        return data

    def save(self):
        pending = self.validated_data["pending"]

        user = User.objects.create(
            name=pending.name,
            username=pending.username,
            email=pending.email,
            password=pending.password,
            account_type=pending.account_type,
        )

        pending.delete()

        refresh = RefreshToken.for_user(user)

        return {
            "user": user,
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }


class ResendVerificationCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, email):
        try:
            self.pending = PendingRegistration.objects.get(email=email)
        except PendingRegistration.DoesNotExist:
            raise serializers.ValidationError("Nu există o înregistrare în așteptare pentru acest email.")

        return email

    def save(self):
        code = generate_verification_code()

        self.pending.verification_code_hash = make_password(code)
        self.pending.verification_expires_at = timezone.now() + timedelta(minutes=15)
        self.pending.save(update_fields=["verification_code_hash", "verification_expires_at"])

        send_mail(
            subject="Cod de verificare E-scraps.",
            message=f"Noul tău cod de verificare este: {code}. Codul expiră în 15 minute.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[self.pending.email],
            fail_silently=False,
        )

        return self.pending


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "name", "username", "email", "account_type"]


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "email"

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        try:
            user_obj = User.objects.get(email=email)
        except User.DoesNotExist:
            pending = PendingRegistration.objects.filter(email=email).first()

            if pending:
                raise serializers.ValidationError({
                    "detail": "Contul nu este verificat încă.",
                    "code": "registration_pending",
                    "email": email,
                })

            raise serializers.ValidationError("Email sau parola greșită.")

        user = authenticate(
            username=user_obj.username,
            password=password
        )

        if user is None:
            raise serializers.ValidationError("Email sau parola greșită.")

        refresh = self.get_token(user)

        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, email):
        try:
            self.user = User.objects.get(email=email)
        except User.DoesNotExist:
            self.user = None

        return email

    def save(self):
        if not self.user:
            return None

        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)

        reset_link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"

        send_mail(
            subject="Resetare parolă E-scraps.",
            message=f"Pentru resetarea parolei, accesează linkul: {reset_link}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[self.user.email],
            fail_silently=False,
        )

        return reset_link


class ResetPasswordSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError("Parolele nu coincid.")

        try:
            uid = force_str(urlsafe_base64_decode(data["uid"]))
            user = User.objects.get(pk=uid)
        except Exception:
            raise serializers.ValidationError("Link invalid.")

        if not default_token_generator.check_token(user, data["token"]):
            raise serializers.ValidationError("Token invalid sau expirat.")

        validate_password(data["password"], user=user)

        data["user"] = user
        return data

    def save(self):
        user = self.validated_data["user"]
        user.set_password(self.validated_data["password"])
        user.save(update_fields=["password"])

        return user
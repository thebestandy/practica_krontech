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
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

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

        existing_user = User.objects.filter(email=data["email"]).first()

        if existing_user:
            if existing_user.auth_provider == "google":
                 raise serializers.ValidationError({
                    "detail": "Există deja un cont cu acest email creat prin Google. Te rugăm să continui cu Google.",
                    "code": "google_account_exists"
                 })

            raise serializers.ValidationError({
            "detail": "Există deja un cont cu acest email.",
             "code": "email_account_exists"
             })

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
        fields = ["id", "name", "username", "email", "account_type", "auth_provider"]


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
        
        if user_obj.auth_provider == "google":
             raise serializers.ValidationError({
                "detail": "Acest cont folosește autentificare cu Google. Te rugăm să continui cu Google.",
                "code": "use_google_login",
                 "email": email,
            })
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

        if self.user.auth_provider == "google":
             raise serializers.ValidationError({
                "detail": "Acest cont folosește autentificare cu Google. Nu poți reseta parola aici.",
                "code": "use_google_login"
            })

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


class GoogleLoginSerializer(serializers.Serializer):
    token = serializers.CharField()

    def validate(self, data):
        token = data["token"]

        if not settings.GOOGLE_CLIENT_ID:
            raise serializers.ValidationError({
                "detail": "Google Client ID is not configured.",
                "code": "google_not_configured"
            })

        try:
            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID
            )

            email = idinfo.get("email")
            name = idinfo.get("name", "")
            email_verified = idinfo.get("email_verified", False)

        except ValueError:
            import requests

            response = requests.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={
                    "Authorization": f"Bearer {token}"
                },
                timeout=10,
            )

            if response.status_code != 200:
                raise serializers.ValidationError({
                    "detail": "Token Google invalid.",
                    "code": "invalid_google_token"
                })

            google_data = response.json()

            email = google_data.get("email")
            name = google_data.get("name", "")
            email_verified = google_data.get("email_verified", False)

            if not email:
                raise serializers.ValidationError({
                    "detail": "Tokenul Google nu conține email.",
                    "code": "google_email_missing"
                })

            if not email_verified:
                raise serializers.ValidationError({
                    "detail": "Emailul Google nu este verificat.",
                    "code": "google_email_not_verified"
                })

            data["google_user"] = {
                "email": email,
                "name": name,
            }

        return data

    def save(self):
        google_user = self.validated_data["google_user"]

        email = google_user["email"]
        name = google_user["name"] or email.split("@")[0]

        user = User.objects.filter(email=email).first()

        if user:
            # Dacă există deja cont normal cu același email,
            # îl lăsăm să intre cu Google, dar NU îl convertim în google-only.
            pass
        else:
            base_username = email.split("@")[0].replace(".", "_")
            username = base_username
            counter = 1

            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1

            user = User.objects.create_user(
                username=username,
                email=email,
                name=name,
                account_type="personal",
                auth_provider="google",
            )

            user.set_unusable_password()
            user.save(update_fields=["password"])

        PendingRegistration.objects.filter(email=email).delete()

        refresh = RefreshToken.for_user(user)

        return {
            "user": user,
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }
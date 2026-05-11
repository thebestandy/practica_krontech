from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    UserView,
    LogoutView,
    EmailLoginView,
    VerifyEmailView,
    ResendVerificationCodeView,
    ForgotPasswordView,
    ResetPasswordView,
    GoogleLoginView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", EmailLoginView.as_view(), name="login"),
    path("google/", GoogleLoginView.as_view(), name="google_login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("user/", UserView.as_view(), name="user"),

    path("verify-email/", VerifyEmailView.as_view(), name="verify_email"),
    path("resend-verification-code/", ResendVerificationCodeView.as_view(), name="resend_verification_code"),

    path("forgot-password/", ForgotPasswordView.as_view(), name="forgot_password"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset_password"),
]
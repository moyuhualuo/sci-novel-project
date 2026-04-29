from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    # Enterprise environments often use internal domains such as .local.
    email: str
    password: str


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class SessionResponse(BaseModel):
    email: str
    role: str
    authenticated: bool
    full_name: str | None = None
    verified: bool = False


class RegistrationResponse(BaseModel):
    email: str
    verification_required: bool
    message: str


class MessageResponse(BaseModel):
    success: bool
    message: str

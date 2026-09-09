from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any

class SchemaBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class AdminUserOut(SchemaBase):
    id: int
    username: str
    role: str
    displayName: Optional[str] = ""
    display_name: Optional[str] = ""
    isActive: Optional[bool] = True
    is_active: Optional[bool] = True
    createdAt: Optional[Any] = ""
    created_at: Optional[Any] = ""

class CreateOwnerRequest(BaseModel):
    username: str
    password: str
    displayName: Optional[str] = ""
    display_name: Optional[str] = ""
    role: Optional[str] = "owner"

class RegisterOwnerRequest(BaseModel):
    username: str
    password: str
    displayName: Optional[str] = ""
    display_name: Optional[str] = ""

class UpdateOwnerRequest(BaseModel):
    displayName: Optional[str] = None
    display_name: Optional[str] = None
    isActive: Optional[bool] = None
    is_active: Optional[bool] = None
    role: Optional[str] = None
    password: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class AdminStatsResponse(SchemaBase):
    total_bookings: int
    booked_count: int
    paid_count: int
    cancelled_count: int
    total_business_value: float
    total_received: float
    total_cash_received: float
    total_upi_received: float
    total_pending_balance: float
    owner_stats: List[Dict[str, Any]]

class SetupStatusResponse(SchemaBase):
    is_configured: bool
    isConfigured: bool
    stall: Optional[Dict[str, Any]] = None
    has_owner: bool
    hasOwner: bool

class FirstTimeSetupRequest(SchemaBase):
    stall: Dict[str, Any]
    owner: RegisterOwnerRequest

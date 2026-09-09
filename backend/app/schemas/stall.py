from pydantic import BaseModel, ConfigDict
from typing import Optional, Any

class SchemaBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

class CreateStallRequest(BaseModel):
    stallCode: Optional[str] = ""
    stall_code: Optional[str] = ""
    stallName: str
    stall_name: Optional[str] = ""
    stallNumber: Optional[str] = "स्टॉल क्र.१०"
    stall_number: Optional[str] = ""
    locationAddress: Optional[str] = ""
    location_address: Optional[str] = ""
    contactPhone: Optional[str] = ""
    contact_phone: Optional[str] = ""
    contactEmail: Optional[str] = ""
    contact_email: Optional[str] = ""
    logoUrl: Optional[str] = ""
    logo_url: Optional[str] = ""

class UpdateStallRequest(BaseModel):
    stallName: Optional[str] = None
    stall_name: Optional[str] = None
    stallNumber: Optional[str] = None
    stall_number: Optional[str] = None
    locationAddress: Optional[str] = None
    location_address: Optional[str] = None
    contactPhone: Optional[str] = None
    contact_phone: Optional[str] = None
    contactEmail: Optional[str] = None
    contact_email: Optional[str] = None
    logoUrl: Optional[str] = None
    logo_url: Optional[str] = None
    isActive: Optional[bool] = None
    is_active: Optional[bool] = None

class StallOut(SchemaBase):
    id: int
    stallCode: Optional[str] = ""
    stall_code: Optional[str] = ""
    stallName: str
    stall_name: Optional[str] = ""
    stallNumber: Optional[str] = ""
    stall_number: Optional[str] = ""
    locationAddress: Optional[str] = ""
    location_address: Optional[str] = ""
    contactPhone: Optional[str] = ""
    contact_phone: Optional[str] = ""
    contactEmail: Optional[str] = ""
    contact_email: Optional[str] = ""
    logoUrl: Optional[str] = ""
    logo_url: Optional[str] = ""
    isActive: Optional[bool] = True
    is_active: Optional[bool] = True
    createdAt: Optional[Any] = ""
    created_at: Optional[Any] = ""

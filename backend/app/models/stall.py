from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from app.database import Base

class Stall(Base):
    __tablename__ = "stalls"

    id = Column(Integer, primary_key=True, autoincrement=True)
    stall_code = Column(String, unique=True, index=True)
    stall_name = Column(String, default="सदिच्छा कला केंद्र")
    stall_number = Column(String, default="स्टॉल क्र.१०")
    location_address = Column(String, default="उदाजी महाराज म्युझियम, आकाशवाणी टॉवर जवळ, गंगापूर रोड, नाशिक")
    contact_phone = Column(String, default="8390397800")
    contact_email = Column(String, default="avadhutjagtap1341@gmail.com")
    logo_url = Column(String, default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from datetime import datetime
from app.database import Base

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, autoincrement=True)
    stall_id = Column(Integer, ForeignKey("stalls.id"), nullable=True, index=True)
    booking_id = Column(String, unique=True, index=True)
    booking_date = Column(String)
    customer_name = Column(String, nullable=False)
    mobile_number = Column(String, nullable=False, index=True)
    email_id = Column(String, default="-")
    statue_number = Column(String, nullable=False, index=True)
    statue_image_url = Column(String, default="")
    total_amount = Column(Float, nullable=False)
    advance_amount = Column(Float, nullable=False)
    balance_amount = Column(Float, nullable=False)
    payment_mode = Column(String)
    booked_by_owner = Column(String)
    booking_status = Column(String, default="BOOKED")
    pdf_bill_url = Column(String, default="")
    final_payment_date = Column(String, default="")
    final_payment_mode = Column(String, default="")
    cancellation_reason = Column(String, default="")
    created_timestamp = Column(DateTime, default=datetime.utcnow)
    final_payment_owner = Column(String, default="")
    cancellation_owner = Column(String, default="")
    cancellation_timestamp = Column(DateTime, nullable=True)

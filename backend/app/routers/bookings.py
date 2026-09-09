from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.booking import (
    CreateBookingRequest, BookingListResponse, BookingSearchResponse,
    MarkPaidRequest, CancelRequest, StandardResponse
)
from app.services import booking_service
from typing import Dict, Any

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])

@router.post("/", response_model=Dict[str, Any])
def create_booking(data: CreateBookingRequest, db: Session = Depends(get_db)):
    return booking_service.create_booking(db, data)

@router.get("/", response_model=BookingListResponse)
def get_all_bookings(db: Session = Depends(get_db)):
    bookings = booking_service.get_all_bookings(db)
    return {"success": True, "bookings": bookings}

@router.get("/search", response_model=BookingSearchResponse)
def search_booking(q: str, db: Session = Depends(get_db)):
    return booking_service.search_booking(db, q)

@router.patch("/{booking_id}/pay", response_model=StandardResponse)
def mark_booking_paid(booking_id: str, data: MarkPaidRequest, db: Session = Depends(get_db)):
    return booking_service.mark_booking_paid(db, booking_id, data.mode, data.owner, data.amount)

@router.patch("/{booking_id}/cancel", response_model=StandardResponse)
def cancel_booking(booking_id: str, data: CancelRequest, db: Session = Depends(get_db)):
    return booking_service.cancel_booking(db, booking_id, data.reason, data.owner)

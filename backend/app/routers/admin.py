from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.admin import (
    LoginRequest, TokenResponse, CreateOwnerRequest, RegisterOwnerRequest,
    UpdateOwnerRequest, ChangePasswordRequest, AdminStatsResponse
)
from app.auth.jwt import create_access_token
from app.auth.dependencies import get_current_admin
from app.services import admin_service, booking_service, ai_analytics_service
from app.models.admin import AdminUser
from app.models.booking import Booking

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.get("/active-owners")
def get_active_owners_public(db: Session = Depends(get_db)):
    """Public endpoint: returns list of active owner display names for booking forms."""
    return admin_service.get_active_owner_names(db)

@router.post("/register")
def register_owner(data: RegisterOwnerRequest, db: Session = Depends(get_db)):
    res = admin_service.register_owner(db, data)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user, error_msg = admin_service.authenticate_admin(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error_msg or "लॉगिन अयशस्वी. युझरनेम किंवा पासवर्ड चुकीचा आहे.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username, "role": user.role, "id": user.id})
    user_dict = admin_service._admin_to_dict(user)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_dict
    }

@router.get("/me")
def get_me(current_user: AdminUser = Depends(get_current_admin)):
    return admin_service._admin_to_dict(current_user)

@router.get("/owners")
def get_all_owners(db: Session = Depends(get_db), current_user: AdminUser = Depends(get_current_admin)):
    return admin_service.get_all_owners(db)

@router.post("/owners")
def create_owner(data: CreateOwnerRequest, db: Session = Depends(get_db), current_user: AdminUser = Depends(get_current_admin)):
    return admin_service.create_admin_user(db, data)

@router.put("/owners/{owner_id}")
def update_owner(owner_id: int, data: UpdateOwnerRequest, db: Session = Depends(get_db), current_user: AdminUser = Depends(get_current_admin)):
    user = admin_service.update_owner(db, owner_id, data)
    if not user:
        raise HTTPException(status_code=404, detail="युझर सापडला नाही")
    return user

@router.delete("/owners/{owner_id}")
def delete_owner(owner_id: int, db: Session = Depends(get_db), current_user: AdminUser = Depends(get_current_admin)):
    if not admin_service.delete_owner(db, owner_id):
        raise HTTPException(status_code=404, detail="युझर सापडला नाही")
    return {"success": True, "message": "खाते निष्क्रीय केले"}

@router.get("/bookings")
def get_all_bookings_admin(db: Session = Depends(get_db), current_user: AdminUser = Depends(get_current_admin)):
    bookings = booking_service.get_all_bookings(db)
    return {"success": True, "bookings": bookings}

@router.put("/bookings/{booking_id}")
def update_booking(booking_id: str, data: dict, db: Session = Depends(get_db), current_user: AdminUser = Depends(get_current_admin)):
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="बुकिंग सापडले नाही")
    
    key_map = {
        "bookingId": "booking_id",
        "bookingDate": "booking_date",
        "customerName": "customer_name",
        "mobileNumber": "mobile_number",
        "emailId": "email_id",
        "statueNumber": "statue_number",
        "statueImageUrl": "statue_image_url",
        "totalAmount": "total_amount",
        "advanceAmount": "advance_amount",
        "balanceAmount": "balance_amount",
        "paymentMode": "payment_mode",
        "bookedByOwner": "booked_by_owner",
        "bookingStatus": "booking_status",
        "pdfBillUrl": "pdf_bill_url",
        "finalPaymentDate": "final_payment_date",
        "finalPaymentMode": "final_payment_mode",
        "finalPaymentOwner": "final_payment_owner",
        "cancellationReason": "cancellation_reason",
        "cancellationOwner": "cancellation_owner",
    }

    for key, value in data.items():
        attr = key_map.get(key, key)
        if hasattr(booking, attr) and attr != "id":
            setattr(booking, attr, value)

    # Recalculate balance_amount
    tot = float(booking.total_amount or 0)
    adv = float(booking.advance_amount or 0)
    booking.balance_amount = max(0.0, tot - adv)

    if booking.balance_amount <= 0 and booking.booking_status != "CANCELLED":
        booking.booking_status = "PAID"
    elif booking.balance_amount > 0 and booking.booking_status == "PAID":
        booking.booking_status = "BOOKED"

    # Regenerate updated Marathi PDF bill
    pdf_context = booking_service._get_pdf_context(db)
    pdf_data = booking_service.generate_marathi_pdf({
        "bookingId": booking.booking_id,
        "bookingDate": booking.booking_date,
        "customerName": booking.customer_name,
        "mobileNumber": booking.mobile_number,
        "emailId": booking.email_id or "-",
        "statueNumber": booking.statue_number,
        "totalAmount": tot,
        "advanceAmount": adv,
        "balanceAmount": booking.balance_amount,
        "paymentMode": booking.payment_mode or "कॅश",
        "bookedByOwner": booking.booked_by_owner or "",
        "status": booking.booking_status,
        "imageBase64": "",
        **pdf_context
    })

    if pdf_data.get("pdfUrl"):
        booking.pdf_bill_url = pdf_data["pdfUrl"]

    db.commit()
    db.refresh(booking)
    return {"success": True, "message": "बुकिंग यशस्वीरित्या अपडेट झाले", "booking": booking_service._booking_to_dict(booking)}

@router.delete("/bookings/{booking_id}")
def hard_delete_booking(booking_id: str, db: Session = Depends(get_db), current_user: AdminUser = Depends(get_current_admin)):
    if current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="फक्त सुपर अॅडमिन बुकिंग हटवू शकतात.")
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="बुकिंग सापडले नाही")
    db.delete(booking)
    db.commit()
    return {"success": True, "message": "बुकिंग कायमस्वरूपी हटवले"}

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), current_user: AdminUser = Depends(get_current_admin)):
    return admin_service.get_booking_stats(db)

@router.get("/export/csv")
def export_csv(db: Session = Depends(get_db), current_user: AdminUser = Depends(get_current_admin)):
    csv_content = admin_service.export_bookings_csv(db)
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=bookings.csv"}
    )

@router.post("/change-password")
def change_password(data: ChangePasswordRequest, db: Session = Depends(get_db), current_user: AdminUser = Depends(get_current_admin)):
    if not admin_service.change_password(db, current_user, data.current_password, data.new_password):
        raise HTTPException(status_code=400, detail="सध्याचा पासवर्ड चुकीचा आहे")
    return {"success": True, "message": "पासवर्ड यशस्वीरित्या बदलला"}

# ==================== AI BUSINESS INTELLIGENCE ENDPOINTS ====================

@router.get("/ai/insights")
def get_ai_insights(db: Session = Depends(get_db), current_user: AdminUser = Depends(get_current_admin)):
    """Generate comprehensive business intelligence insights powered by Gemini 1.5 Flash."""
    return ai_analytics_service.generate_ai_business_insights(db)

@router.post("/ai/query")
def post_ai_query(payload: dict, db: Session = Depends(get_db), current_user: AdminUser = Depends(get_current_admin)):
    """Answer natural language business query from stall owners."""
    query = payload.get("query", "")
    return ai_analytics_service.ask_ai_query(db, query)

@router.get("/ai/status")
def get_ai_status(current_user: AdminUser = Depends(get_current_admin)):
    """Check if Gemini API key is configured."""
    key = ai_analytics_service.get_gemini_api_key()
    return {
        "configured": bool(key),
        "keyMasked": f"{key[:4]}...{key[-4:]}" if len(key) >= 8 else ("Configured" if key else "")
    }

@router.post("/ai/api-key")
def set_ai_api_key(payload: dict, current_user: AdminUser = Depends(get_current_admin)):
    """Save and validate new Gemini API key."""
    api_key = payload.get("apiKey", "")
    res = ai_analytics_service.save_gemini_api_key(api_key)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("message", "API Key सेव्ह करताना त्रुटी आली."))
    return res


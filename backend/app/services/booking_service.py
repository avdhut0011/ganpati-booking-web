from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from datetime import datetime
from app.models.booking import Booking
from app.models.stall import Stall
from app.models.admin import AdminUser
from app.schemas.booking import CreateBookingRequest
from app.services.image_service import save_statue_image
from app.services.pdf_service import generate_marathi_pdf

from app.services import admin_service

def _get_pdf_context(db: Session) -> dict:
    """Fetch active owner names and stall details for PDF generation (excludes superadmin)."""
    owner_names = admin_service.get_active_owner_names(db)
    
    stall = db.query(Stall).first()
    ctx = {"ownerNames": owner_names}
    if stall:
        ctx["stallName"] = stall.stall_name
        ctx["stallNumber"] = stall.stall_number
        ctx["locationAddress"] = stall.location_address
        ctx["contactPhone"] = stall.contact_phone
    return ctx

def generate_booking_id(db: Session) -> str:
    year = datetime.utcnow().year
    prefix = f"GB-{year}-"
    
    last_booking = db.query(Booking).filter(Booking.booking_id.like(f"{prefix}%")).order_by(Booking.id.desc()).first()
    if last_booking:
        try:
            last_num = int(last_booking.booking_id.split("-")[-1])
            new_num = last_num + 1
        except Exception:
            new_num = 1
    else:
        new_num = 1
        
    return f"{prefix}{new_num:04d}"

def validate_statue_unique(db: Session, statue_number: str, exclude_booking_id: str = None) -> tuple[bool, str]:
    query = db.query(Booking).filter(
        Booking.statue_number == statue_number,
        Booking.booking_status.in_(["BOOKED", "PAID"])
    )
    if exclude_booking_id:
        query = query.filter(Booking.booking_id != exclude_booking_id)
        
    existing = query.first()
    if existing:
        return False, f"मूर्ती क्रमांक '{statue_number}' आधीच बूक आहे (आयडी: {existing.booking_id}, ग्राहक: {existing.customer_name})"
    return True, ""

def create_booking(db: Session, data: CreateBookingRequest) -> dict:
    is_valid, msg = validate_statue_unique(db, data.statueNumber)
    if not is_valid:
        return {
            "success": False,
            "message": msg,
            "bookingId": "",
            "pdfUrl": "",
            "pdfBase64": "",
            "balanceAmount": 0
        }
        
    booking_id = generate_booking_id(db)
    image_url = save_statue_image(data.statueImageBase64, booking_id)
    
    total = float(data.totalAmount) if data.totalAmount else 0.0
    advance = float(data.advanceAmount) if data.advanceAmount else 0.0
    balance = Math_max_zero = max(0.0, total - advance)
    status = "PAID" if balance <= 0 else "BOOKED"
    
    booking_date = data.bookingDate if data.bookingDate else datetime.now().strftime("%d/%m/%Y")
    
    pdf_context = _get_pdf_context(db)
    pdf_data = generate_marathi_pdf({
        "bookingId": booking_id,
        "bookingDate": booking_date,
        "customerName": data.customerName,
        "mobileNumber": data.mobileNumber,
        "emailId": data.emailId or "-",
        "statueNumber": data.statueNumber,
        "totalAmount": total,
        "advanceAmount": advance,
        "balanceAmount": balance,
        "paymentMode": data.paymentMode,
        "bookedByOwner": data.bookedByOwner,
        "status": status,
        "imageBase64": data.statueImageBase64,
        **pdf_context
    })
    
    new_booking = Booking(
        booking_id=booking_id,
        booking_date=booking_date,
        customer_name=data.customerName,
        mobile_number=data.mobileNumber,
        email_id=data.emailId or "-",
        statue_number=data.statueNumber,
        statue_image_url=image_url,
        total_amount=total,
        advance_amount=advance,
        balance_amount=balance,
        payment_mode=data.paymentMode,
        booked_by_owner=data.bookedByOwner,
        booking_status=status,
        pdf_bill_url=pdf_data.get("pdfUrl", "")
    )
    
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    
    return {
        "success": True,
        "bookingId": booking_id,
        "pdfUrl": pdf_data.get("pdfUrl", ""),
        "pdfBase64": pdf_data.get("pdfBase64", ""),
        "balanceAmount": balance,
        "message": f"बुकिंग यशस्वीरीत्या नोंदवले गेले! बुकिंग आयडी: {booking_id}"
    }

def mark_booking_paid(db: Session, booking_id: str, mode: str, owner: str, amount: float = None) -> dict:
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        return {"success": False, "message": f"बुकिंग आयडी '{booking_id}' सापडला नाही"}
        
    if booking.booking_status == "PAID":
        return {"success": False, "message": f"बुकिंग आयडी '{booking_id}' आधीच PAID (पूर्ण जमा) आहे"}
    if booking.booking_status == "CANCELLED":
        return {"success": False, "message": f"बुकिंग आयडी '{booking_id}' रद्द (CANCELLED) आहे"}
        
    current_balance = float(booking.balance_amount or 0)
    current_advance = float(booking.advance_amount or 0)
    total = float(booking.total_amount or 0)

    # Determine deposit amount: use provided amount, fallback to full remaining balance
    if amount is not None and amount > 0:
        pay_amount = min(float(amount), current_balance)  # Cap to current balance
    else:
        pay_amount = current_balance  # Full remaining balance

    if pay_amount <= 0:
        return {"success": False, "message": "जमा करायची रक्कम ₹0 पेक्षा जास्त असावी."}

    new_advance = current_advance + pay_amount
    new_balance = max(0.0, total - new_advance)

    booking.advance_amount = new_advance
    booking.balance_amount = new_balance

    if new_balance <= 0:
        booking.booking_status = "PAID"
        booking.balance_amount = 0.0
    else:
        booking.booking_status = "BOOKED"

    booking.final_payment_date = datetime.now().strftime("%d/%m/%Y")
    booking.final_payment_mode = mode or "कॅश"
    booking.final_payment_owner = owner or ""

    # Regenerate updated Marathi PDF bill with new figures
    pdf_context = _get_pdf_context(db)
    pdf_data = generate_marathi_pdf({
        "bookingId": booking.booking_id,
        "bookingDate": booking.booking_date,
        "customerName": booking.customer_name,
        "mobileNumber": booking.mobile_number,
        "emailId": booking.email_id or "-",
        "statueNumber": booking.statue_number,
        "totalAmount": total,
        "advanceAmount": new_advance,
        "balanceAmount": new_balance,
        "paymentMode": mode or "कॅश",
        "bookedByOwner": booking.booked_by_owner,
        "status": booking.booking_status,
        "imageBase64": "",
        **pdf_context
    })

    if pdf_data.get("pdfUrl"):
        booking.pdf_bill_url = pdf_data["pdfUrl"]

    db.commit()

    if new_balance <= 0:
        msg = f"बुकिंग आयडी {booking_id} ची पूर्ण बाकी रक्कम (₹{pay_amount:,.0f}) जमा झाली असून स्टेटस 'PAID' (पूर्ण जमा) झाले आहे!"
    else:
        msg = f"बुकिंग आयडी {booking_id} ची जमा रक्कम ₹{pay_amount:,.0f} नोंदवली गेली! नवीन जमा रक्कम: ₹{new_advance:,.0f} | नवीन बाकी येणे: ₹{new_balance:,.0f}"

    return {"success": True, "message": msg}

def cancel_booking(db: Session, booking_id: str, reason: str, owner: str) -> dict:
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        return {"success": False, "message": f"बुकिंग आयडी '{booking_id}' सापडला नाही"}
        
    if booking.booking_status == "CANCELLED":
        return {"success": False, "message": f"बुकिंग आयडी '{booking_id}' आधीच रद्द (CANCELLED) आहे"}
        
    booking.booking_status = "CANCELLED"
    booking.cancellation_reason = reason or "ग्राहकाची विनंती"
    booking.cancellation_owner = owner or ""
    booking.cancellation_timestamp = datetime.utcnow()
    
    db.commit()
    return {"success": True, "message": f"बुकिंग आयडी {booking_id} यशस्वीरित्या रद्द (CANCELLED) करण्यात आले आहे."}

def _booking_to_dict(b: Booking) -> dict:
    """Serialize a Booking ORM object to a camelCase dict safe for JSON."""
    return {
        "id": b.id,
        "rowIndex": b.id,
        "bookingId": b.booking_id or "",
        "bookingDate": b.booking_date or "",
        "customerName": b.customer_name or "",
        "mobileNumber": b.mobile_number or "",
        "emailId": b.email_id or "-",
        "statueNumber": b.statue_number or "",
        "statueImageUrl": b.statue_image_url or "",
        "totalAmount": float(b.total_amount or 0),
        "advanceAmount": float(b.advance_amount or 0),
        "balanceAmount": float(b.balance_amount or 0),
        "paymentMode": b.payment_mode or "",
        "bookedByOwner": b.booked_by_owner or "",
        "bookingStatus": b.booking_status or "BOOKED",
        "pdfBillUrl": b.pdf_bill_url or "",
        "finalPaymentDate": b.final_payment_date or "",
        "finalPaymentMode": b.final_payment_mode or "",
        "cancellationReason": b.cancellation_reason or "",
        "createdTimestamp": b.created_timestamp.strftime("%Y-%m-%d %H:%M:%S") if getattr(b, 'created_timestamp', None) else "",
        "finalPaymentOwner": b.final_payment_owner or "",
        "cancellationOwner": b.cancellation_owner or "",
        "cancellationTimestamp": b.cancellation_timestamp.strftime("%Y-%m-%d %H:%M:%S") if getattr(b, 'cancellation_timestamp', None) else "",
    }

def search_booking(db: Session, query: str) -> dict:
    search_term = f"%{query}%"
    booking = db.query(Booking).filter(
        or_(
            Booking.booking_id == query,
            Booking.mobile_number == query,
            Booking.customer_name.ilike(search_term),
            Booking.statue_number.ilike(search_term)
        )
    ).first()
    if not booking:
        return {"success": False, "booking": None, "message": f"'{query}' साठी कोणतेही जुळणारे बुकिंग रेकॉर्ड सापडले नाही."}
    return {"success": True, "booking": _booking_to_dict(booking), "message": "बुकिंग सापडली"}

def get_all_bookings(db: Session) -> list:
    bookings = db.query(Booking).order_by(Booking.id.desc()).all()
    return [_booking_to_dict(b) for b in bookings]

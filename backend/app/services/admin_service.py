from sqlalchemy.orm import Session
from sqlalchemy import func, text
import io
import csv
import bcrypt
from app.models.admin import AdminUser
from app.models.booking import Booking
from app.models.stall import Stall
from app.schemas.admin import CreateOwnerRequest, UpdateOwnerRequest, RegisterOwnerRequest, FirstTimeSetupRequest
from app.schemas.stall import CreateStallRequest, UpdateStallRequest
from app.auth.jwt import create_access_token

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def authenticate_admin(db: Session, username: str, password: str) -> tuple[AdminUser | None, str]:
    """
    Authenticate user by username or display_name (case-insensitive & trimmed).
    Returns (AdminUser, "OK") on success, or (None, detailed_error_message) on failure.
    """
    u_clean = username.strip() if username else ""
    p_raw = password if password is not None else ""
    p_clean = p_raw.strip()

    if not u_clean:
        return None, "कृपया युझरनेम किंवा नाव टाका."
    if not p_clean:
        return None, "कृपया पासवर्ड टाका."

    # 1. Search by exact username (case-insensitive)
    user = db.query(AdminUser).filter(func.lower(AdminUser.username) == u_clean.lower()).first()

    # 2. If not found, search by exact display_name (case-insensitive)
    if not user:
        user = db.query(AdminUser).filter(func.lower(AdminUser.display_name) == u_clean.lower()).first()

    # 3. If still not found, search by display_name starting with u_clean (e.g., 'शिव' matching 'शिव sir')
    if not user:
        user = db.query(AdminUser).filter(func.lower(AdminUser.display_name).startswith(u_clean.lower())).first()

    if not user:
        return None, f"युझरनेम किंवा नाव '{u_clean}' प्रणालीमध्ये सापडले नाही!"

    # Verify password (try raw and trimmed)
    if not verify_password(p_raw, user.hashed_password) and not verify_password(p_clean, user.hashed_password):
        return None, "पासवर्ड चुकीचा आहे! कृपया योग्य पासवर्ड टाका."

    if not user.is_active:
        return None, f"'{user.display_name or user.username}' हे खाते निष्क्रीय (Deactivated) केले आहे. कृपया ॲडमिनशी संपर्क साधा."

    return user, "OK"

def _stall_to_dict(stall: Stall) -> dict:
    created = stall.created_at.strftime("%Y-%m-%d %H:%M:%S") if getattr(stall, 'created_at', None) else ""
    return {
        "id": stall.id,
        "stallCode": stall.stall_code or f"STALL-{stall.id:03d}",
        "stall_code": stall.stall_code or f"STALL-{stall.id:03d}",
        "stallName": stall.stall_name or "सदिच्छा कला केंद्र",
        "stall_name": stall.stall_name or "सदिच्छा कला केंद्र",
        "stallNumber": stall.stall_number or "स्टॉल क्र.१०",
        "stall_number": stall.stall_number or "स्टॉल क्र.१०",
        "locationAddress": stall.location_address or "",
        "location_address": stall.location_address or "",
        "contactPhone": stall.contact_phone or "",
        "contact_phone": stall.contact_phone or "",
        "contactEmail": stall.contact_email or "",
        "contact_email": stall.contact_email or "",
        "logoUrl": stall.logo_url or "",
        "logo_url": stall.logo_url or "",
        "isActive": bool(stall.is_active),
        "is_active": bool(stall.is_active),
        "createdAt": created,
        "created_at": created
    }

def ensure_default_stall(db: Session) -> Stall:
    # Auto-migration for SQLite tables missing stall_id column
    for table_name in ["admin_users", "bookings"]:
        try:
            db.execute(text(f"ALTER TABLE {table_name} ADD COLUMN stall_id INTEGER"))
            db.commit()
        except Exception:
            db.rollback()

    stall = db.query(Stall).first()
    if not stall:
        stall = Stall(
            stall_code="STALL-001",
            stall_name="सदिच्छा कला केंद्र",
            stall_number="स्टॉल क्र.१०",
            location_address="उदाजी महाराज म्युझियम, आकाशवाणी टॉवर जवळ, गंगापूर रोड, नाशिक",
            contact_phone="8390397800",
            contact_email="avadhutjagtap1341@gmail.com",
            is_active=True
        )
        db.add(stall)
        db.commit()
        db.refresh(stall)
    
    # Associate unassigned users and bookings to default stall
    try:
        db.query(AdminUser).filter(AdminUser.stall_id == None).update({AdminUser.stall_id: stall.id}, synchronize_session=False)
        db.query(Booking).filter(Booking.stall_id == None).update({Booking.stall_id: stall.id}, synchronize_session=False)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[Stall Migration Warning] {e}")

    return stall

def ensure_default_admin(db: Session):
    # Superadmin
    admin = db.query(AdminUser).filter(func.lower(AdminUser.username) == "admin").first()
    if not admin:
        db.add(AdminUser(
            username="admin",
            hashed_password=get_password_hash("admin123"),
            display_name="सुपर अॅडमिन",
            role="superadmin",
            is_active=True
        ))
    else:
        admin.is_active = True
        if not verify_password("admin123", admin.hashed_password):
            admin.hashed_password = get_password_hash("admin123")
    
    # Owners
    defaults = [
        ("shiv", "shiv123", "शिव"),
        ("rahul", "rahul123", "राहुल"),
        ("harshad", "harshad123", "हर्षद")
    ]
    for u, p, d in defaults:
        existing = db.query(AdminUser).filter(func.lower(AdminUser.username) == u.lower()).first()
        if not existing:
            db.add(AdminUser(
                username=u,
                hashed_password=get_password_hash(p),
                display_name=d,
                role="owner",
                is_active=True
            ))
        else:
            existing.is_active = True
            if not verify_password(p, existing.hashed_password) and existing.username in ["shiv", "rahul", "harshad"]:
                existing.hashed_password = get_password_hash(p)
    db.commit()

def get_setup_status(db: Session) -> dict:
    stall = db.query(Stall).first()
    owner = db.query(AdminUser).filter(AdminUser.role == "owner").first()
    # Check if a custom stall was created or customized
    is_configured = bool(stall and owner)
    stall_data = _stall_to_dict(stall) if stall else None
    return {
        "is_configured": is_configured,
        "isConfigured": is_configured,
        "stall": stall_data,
        "has_owner": bool(owner),
        "hasOwner": bool(owner)
    }

def init_first_time_setup(db: Session, data: dict) -> dict:
    stall_req = data.get("stall", {})
    owner_req = data.get("owner", {})
    
    # 1. Create or Update Primary Stall
    stall = db.query(Stall).first()
    stall_name = (stall_req.get("stall_name") or stall_req.get("stallName") or "सदिच्छा कला केंद्र").strip()
    stall_number = (stall_req.get("stall_number") or stall_req.get("stallNumber") or "स्टॉल क्र.१०").strip()
    location_address = (stall_req.get("location_address") or stall_req.get("locationAddress") or "").strip()
    contact_phone = (stall_req.get("contact_phone") or stall_req.get("contactPhone") or "").strip()
    contact_email = (stall_req.get("contact_email") or stall_req.get("contactEmail") or "").strip()
    logo_url = (stall_req.get("logo_url") or stall_req.get("logoUrl") or "").strip()

    if stall:
        stall.stall_name = stall_name
        stall.stall_number = stall_number
        stall.location_address = location_address
        stall.contact_phone = contact_phone
        stall.contact_email = contact_email
        stall.logo_url = logo_url
        stall.is_active = True
    else:
        stall = Stall(
            stall_code="STALL-001",
            stall_name=stall_name,
            stall_number=stall_number,
            location_address=location_address,
            contact_phone=contact_phone,
            contact_email=contact_email,
            logo_url=logo_url,
            is_active=True
        )
        db.add(stall)
    db.commit()
    db.refresh(stall)

    # 2. Create Owner Account
    username = (owner_req.get("username") or "").strip()
    password = owner_req.get("password") or ""
    display_name = (owner_req.get("display_name") or owner_req.get("displayName") or username).strip()

    if not username or not password:
        return {"success": False, "message": "युझरनेम आणि पासवर्ड आवश्यक आहेत."}

    user = db.query(AdminUser).filter(AdminUser.username == username).first()
    if user:
        user.hashed_password = get_password_hash(password)
        user.display_name = display_name
        user.stall_id = stall.id
        user.is_active = True
    else:
        user = AdminUser(
            username=username,
            hashed_password=get_password_hash(password),
            display_name=display_name,
            role="owner",
            stall_id=stall.id,
            is_active=True
        )
        db.add(user)
    
    # Associate all unassigned records to this stall
    try:
        db.query(Booking).filter(Booking.stall_id == None).update({Booking.stall_id: stall.id}, synchronize_session=False)
        db.query(AdminUser).filter(AdminUser.stall_id == None).update({AdminUser.stall_id: stall.id}, synchronize_session=False)
    except Exception:
        pass
        
    db.commit()
    db.refresh(user)

    # Create access token for instant login
    access_token = create_access_token(data={"sub": user.username, "role": user.role, "id": user.id})

    return {
        "success": True,
        "message": "स्टॉल आणि मालक खाते यशस्वीरीत्या सेट झाले!",
        "access_token": access_token,
        "token_type": "bearer",
        "user": _admin_to_dict(user),
        "stall": _stall_to_dict(stall)
    }

def _admin_to_dict(user: AdminUser) -> dict:
    created = user.created_at.strftime("%Y-%m-%d %H:%M:%S") if getattr(user, 'created_at', None) else ""
    return {
        "id": user.id,
        "username": user.username,
        "role": user.role or "owner",
        "displayName": user.display_name or user.username,
        "display_name": user.display_name or user.username,
        "isActive": bool(user.is_active),
        "is_active": bool(user.is_active),
        "createdAt": created,
        "created_at": created
    }

def create_admin_user(db: Session, data: CreateOwnerRequest) -> dict:
    display_name = data.display_name or data.displayName or data.username
    user = AdminUser(
        username=data.username,
        hashed_password=get_password_hash(data.password),
        display_name=display_name,
        role=data.role or "owner"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _admin_to_dict(user)

def register_owner(db: Session, data: RegisterOwnerRequest) -> dict:
    existing = db.query(AdminUser).filter(AdminUser.username == data.username.strip()).first()
    if existing:
        return {"success": False, "message": f"युझरनेम '{data.username}' आधीच नोंदणीकृत आहे. कृपया लॉगिन करा किंवा दुसरे युझरनेम टाका."}
    
    display_name = (data.display_name or data.displayName or data.username).strip()
    user = AdminUser(
        username=data.username.strip(),
        hashed_password=get_password_hash(data.password),
        display_name=display_name,
        role="owner",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"success": True, "message": f"मालक खाते '{display_name}' यशस्वीरीत्या तयार झाले! आता लॉगिन करा.", "user": _admin_to_dict(user)}

def create_stall(db: Session, data: CreateStallRequest) -> dict:
    stall_name = (data.stall_name or data.stallName or "सदिच्छा कला केंद्र").strip()
    count = db.query(Stall).count() + 1
    stall_code = (data.stall_code or data.stallCode or f"STALL-{count:03d}").strip()
    
    stall = Stall(
        stall_code=stall_code,
        stall_name=stall_name,
        stall_number=(data.stall_number or data.stallNumber or "स्टॉल क्र.१०").strip(),
        location_address=(data.location_address or data.locationAddress or "").strip(),
        contact_phone=(data.contact_phone or data.contactPhone or "").strip(),
        contact_email=(data.contact_email or data.contactEmail or "").strip(),
        logo_url=(data.logo_url or data.logoUrl or "").strip(),
        is_active=True
    )
    db.add(stall)
    db.commit()
    db.refresh(stall)
    return {"success": True, "message": f"नवीन स्टॉल '{stall_name}' यशस्वीरीत्या तयार झाला!", "stall": _stall_to_dict(stall)}

def get_all_stalls(db: Session) -> list:
    stalls = db.query(Stall).all()
    return [_stall_to_dict(s) for s in stalls]

def get_stall_by_id(db: Session, stall_id: int) -> dict | None:
    stall = db.query(Stall).filter(Stall.id == stall_id).first()
    return _stall_to_dict(stall) if stall else None

def update_stall(db: Session, stall_id: int, data: UpdateStallRequest) -> dict:
    stall = db.query(Stall).filter(Stall.id == stall_id).first()
    if not stall:
        return {"success": False, "message": "स्टॉल सापडला नाही"}
    
    if data.stall_name or data.stallName:
        stall.stall_name = (data.stall_name or data.stallName).strip()
    if data.stall_number or data.stallNumber:
        stall.stall_number = (data.stall_number or data.stallNumber).strip()
    if data.location_address or data.locationAddress:
        stall.location_address = (data.location_address or data.locationAddress).strip()
    if data.contact_phone or data.contactPhone:
        stall.contact_phone = (data.contact_phone or data.contactPhone).strip()
    if data.contact_email or data.contactEmail:
        stall.contact_email = (data.contact_email or data.contactEmail).strip()
    if data.logo_url or data.logoUrl:
        stall.logo_url = (data.logo_url or data.logoUrl).strip()
    if data.is_active is not None or data.isActive is not None:
        stall.is_active = bool(data.is_active if data.is_active is not None else data.isActive)

    db.commit()
    db.refresh(stall)
    return {"success": True, "message": "स्टॉलची माहिती अपडेट झाली!", "stall": _stall_to_dict(stall)}

def get_all_owners(db: Session) -> list:
    users = db.query(AdminUser).all()
    return [_admin_to_dict(u) for u in users]

def get_active_owner_names(db: Session) -> list:
    """Return list of active owner display names for booking forms and PDF checkboxes (strictly excludes superadmin/admin)."""
    users = db.query(AdminUser).filter(
        AdminUser.is_active == True,
        AdminUser.role == "owner",
        AdminUser.username != "admin"
    ).all()
    return [u.display_name or u.username for u in users if u.role != "superadmin" and u.username != "admin"]

def update_owner(db: Session, owner_id: int, data: UpdateOwnerRequest) -> dict | None:
    user = db.query(AdminUser).filter(AdminUser.id == owner_id).first()
    if not user:
        return None
    
    name = data.display_name if data.display_name is not None else data.displayName
    if name is not None:
        user.display_name = name.strip()
        
    active = data.is_active if data.is_active is not None else data.isActive
    if active is not None:
        user.is_active = bool(active)
        
    if data.role is not None:
        user.role = data.role

    if getattr(data, 'password', None) and data.password.strip():
        user.hashed_password = get_password_hash(data.password.strip())

    db.commit()
    db.refresh(user)
    return _admin_to_dict(user)

def delete_owner(db: Session, owner_id: int) -> bool:
    user = db.query(AdminUser).filter(AdminUser.id == owner_id).first()
    if not user:
        return False
    user.is_active = False
    db.commit()
    return True

def change_password(db: Session, admin: AdminUser, current_pw: str, new_pw: str) -> bool:
    if not verify_password(current_pw, admin.hashed_password):
        return False
    admin.hashed_password = get_password_hash(new_pw)
    db.commit()
    return True

def get_booking_stats(db: Session) -> dict:
    total_bookings = db.query(Booking).count()
    booked_count = db.query(Booking).filter(Booking.booking_status == "BOOKED").count()
    paid_count = db.query(Booking).filter(Booking.booking_status == "PAID").count()
    cancelled_count = db.query(Booking).filter(Booking.booking_status == "CANCELLED").count()
    
    # Business value = only active (non-cancelled) bookings
    active_bookings = db.query(Booking).filter(Booking.booking_status != "CANCELLED").all()
    total_business_value = sum(float(b.total_amount or 0) for b in active_bookings)
    
    # Revenue includes ALL bookings (including cancelled) — no refund policy
    all_bookings = db.query(Booking).all()
    
    total_cash = 0.0
    total_upi = 0.0
    total_pending_balance = 0.0
    
    owner_map = {}
    def get_owner_entry(name):
        clean = name.strip() if name else "इतर"
        if clean not in owner_map:
            owner_map[clean] = {"name": clean, "count": 0, "cash": 0.0, "upi": 0.0, "total": 0.0}
        return owner_map[clean]

    for b in all_bookings:
        adv = float(b.advance_amount or 0)  # Total received (includes all partial deposits)
        bal = float(b.balance_amount or 0)   # Current remaining balance
        pay_mode = (b.payment_mode or "").upper()
        owner = b.booked_by_owner or "इतर"

        # Pending balance only for BOOKED bookings (not PAID, not CANCELLED)
        if b.booking_status == "BOOKED":
            total_pending_balance += bal

        # Revenue: advance_amount from ALL bookings counts as received
        # (cancelled bookings keep their advance — no refund)
        o_entry = get_owner_entry(owner)
        o_entry["count"] += 1
        if "कॅश" in pay_mode or "CASH" in pay_mode:
            total_cash += adv
            o_entry["cash"] += adv
        else:
            total_upi += adv
            o_entry["upi"] += adv

    for o in owner_map.values():
        o["total"] = o["cash"] + o["upi"]

    total_received = total_cash + total_upi
    owner_stats = list(owner_map.values())

    return {
        "total_bookings": total_bookings,
        "booked_count": booked_count,
        "paid_count": paid_count,
        "cancelled_count": cancelled_count,
        "total_business_value": total_business_value,
        "total_received": total_received,
        "total_revenue": total_received,
        "total_cash_received": total_cash,
        "cash_received": total_cash,
        "total_upi_received": total_upi,
        "upi_received": total_upi,
        "total_pending_balance": total_pending_balance,
        "pending_balance": total_pending_balance,
        "owner_stats": owner_stats
    }

def export_bookings_csv(db: Session) -> str:
    bookings = db.query(Booking).all()
    output = io.StringIO()
    writer = csv.writer(output)
    
    headers = [
        "ID", "Booking ID", "Date", "Customer Name", "Mobile", "Email",
        "Statue No", "Total Amount", "Advance", "Balance", "Payment Mode",
        "Booked By", "Status", "Final Pay Date", "Final Pay Mode",
        "Final Pay Owner", "Cancel Reason", "Cancel Owner", "Created At"
    ]
    writer.writerow(headers)
    
    for b in bookings:
        writer.writerow([
            b.id, b.booking_id, b.booking_date, b.customer_name, b.mobile_number, b.email_id,
            b.statue_number, b.total_amount, b.advance_amount, b.balance_amount, b.payment_mode,
            b.booked_by_owner, b.booking_status, b.final_payment_date, b.final_payment_mode,
            b.final_payment_owner, b.cancellation_reason, b.cancellation_owner, b.created_timestamp
        ])
    return output.getvalue()

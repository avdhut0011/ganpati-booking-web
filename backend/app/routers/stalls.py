from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.stall import CreateStallRequest, UpdateStallRequest
from app.auth.dependencies import get_current_admin
from app.services import admin_service
from app.models.admin import AdminUser

router = APIRouter(prefix="/api/stalls", tags=["Stalls"])

@router.get("")
@router.get("/")
def get_stalls(db: Session = Depends(get_db)):
    return {"success": True, "stalls": admin_service.get_all_stalls(db)}

@router.get("/{stall_id}")
def get_stall(stall_id: int, db: Session = Depends(get_db)):
    stall = admin_service.get_stall_by_id(db, stall_id)
    if not stall:
        raise HTTPException(status_code=404, detail="स्टॉल सापडला नाही")
    return {"success": True, "stall": stall}

@router.post("")
@router.post("/")
def create_stall(data: CreateStallRequest, db: Session = Depends(get_db), current_user: AdminUser = Depends(get_current_admin)):
    res = admin_service.create_stall(db, data)
    return res

@router.put("/{stall_id}")
def update_stall(stall_id: int, data: UpdateStallRequest, db: Session = Depends(get_db), current_user: AdminUser = Depends(get_current_admin)):
    res = admin_service.update_stall(db, stall_id, data)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

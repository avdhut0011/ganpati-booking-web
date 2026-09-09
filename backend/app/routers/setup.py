from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.admin import SetupStatusResponse, FirstTimeSetupRequest
from app.services.admin_service import get_setup_status, init_first_time_setup

router = APIRouter(prefix="/api/setup", tags=["Setup"])

@router.get("/status", response_model=SetupStatusResponse)
@router.get("/status/")
def check_status(db: Session = Depends(get_db)):
    return get_setup_status(db)

@router.post("/init")
@router.post("/init/")
def init_setup(data: dict, db: Session = Depends(get_db)):
    res = init_first_time_setup(db, data)
    if not res.get("success"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=res.get("message"))
    return res

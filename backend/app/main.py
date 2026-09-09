from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import booking, admin, stall
from app.routers import bookings, admin as admin_router, stalls, setup
from app.services.admin_service import ensure_default_admin, ensure_default_stall
import os
import sys

app = FastAPI(title=settings.APP_TITLE, version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Create DB tables
Base.metadata.create_all(bind=engine)

@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        ensure_default_stall(db)
        ensure_default_admin(db)
    finally:
        db.close()

# Static files for uploads
os.makedirs(settings.PHOTOS_DIR, exist_ok=True)
os.makedirs(settings.PDFS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(bookings.router)
app.include_router(admin_router.router)
app.include_router(stalls.router)
app.include_router(setup.router)

# Locate React Dist directory (supporting PyInstaller sys._MEIPASS)
if hasattr(sys, '_MEIPASS'):
    frontend_dist = os.path.join(sys._MEIPASS, 'frontend_dist')
else:
    frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'dist'))

if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Prevent API routes from falling through to HTML index
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    def root():
        return {"message": "गणपती बाप्पा मोरया! 🌺 API is running."}

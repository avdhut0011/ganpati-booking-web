import base64
import os
from app.config import settings
from app.services import s3_service

def save_statue_image(base64_data: str, booking_id: str) -> str:
    if not base64_data:
        return ""
        
    try:
        if "," in base64_data:
            header, encoded = base64_data.split(",", 1)
        else:
            encoded = base64_data
            
        decoded_data = base64.b64decode(encoded)
        filename = f"{booking_id}.jpg"
        filepath = os.path.join(settings.PHOTOS_DIR, filename)
        
        with open(filepath, "wb") as f:
            f.write(decoded_data)

        # Upload to AWS S3 if cloud storage enabled
        if settings.USE_CLOUD_STORAGE and settings.AWS_S3_BUCKET_NAME:
            s3_url = s3_service.upload_file_to_s3(filepath, f"photos/{filename}", content_type="image/jpeg")
            if s3_url:
                return s3_url
            
        return f"/uploads/photos/{filename}"
    except Exception as e:
        print(f"Error saving image: {e}")
        return ""

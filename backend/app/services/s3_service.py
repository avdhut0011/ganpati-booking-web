import os
from app.config import settings

def get_s3_client():
    if not settings.USE_CLOUD_STORAGE or not settings.AWS_S3_BUCKET_NAME:
        return None
    try:
        import boto3
        kwargs = {"region_name": settings.AWS_REGION}
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
            kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY
        return boto3.client("s3", **kwargs)
    except ImportError:
        print("[AWS S3] boto3 library not installed. Install with 'pip install boto3' to enable AWS S3.")
        return None
    except Exception as e:
        print(f"[AWS S3] Error initializing S3 client: {e}")
        return None

def upload_file_to_s3(file_path: str, object_key: str, content_type: str = "application/octet-stream") -> str:
    """Upload a local file to AWS S3 bucket and return its public/CDN URL."""
    s3 = get_s3_client()
    if not s3:
        return ""
    try:
        extra_args = {"ContentType": content_type}
        s3.upload_file(file_path, settings.AWS_S3_BUCKET_NAME, object_key, ExtraArgs=extra_args)
        
        if settings.AWS_CLOUDFRONT_DOMAIN:
            return f"https://{settings.AWS_CLOUDFRONT_DOMAIN}/{object_key}"
        elif settings.AWS_S3_CUSTOM_DOMAIN:
            return f"https://{settings.AWS_S3_CUSTOM_DOMAIN}/{object_key}"
        else:
            return f"https://{settings.AWS_S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{object_key}"
    except ClientError as e:
        print(f"[AWS S3] Upload failed for {object_key}: {e}")
        return ""
    except Exception as e:
        print(f"[AWS S3] Unexpected error uploading {object_key}: {e}")
        return ""

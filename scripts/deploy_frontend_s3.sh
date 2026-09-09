#!/bin/bash
# ==============================================================================
# 🌺 DEPLOY FRONTEND TO AWS S3 & INVALIDATE CLOUDFRONT CACHE
# ==============================================================================
set -e

S3_BUCKET="${1:-ganpati-booking-frontend-2026}"
CLOUDFRONT_DIST_ID="${2:-}"

echo "🔨 Building React Frontend for Production..."
cd "$(dirname "$0")/../frontend"
npm ci
npm run build

echo "☁️ Syncing dist/ to AWS S3 Bucket: s3://$S3_BUCKET..."
aws s3 sync dist/ "s3://$S3_BUCKET" --delete --cache-control "max-age=31536000,public"
aws s3 cp dist/index.html "s3://$S3_BUCKET/index.html" --cache-control "no-cache,no-store,must-revalidate"

if [ -n "$CLOUDFRONT_DIST_ID" ]; then
    echo "⚡ Invalidating AWS CloudFront cache..."
    aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DIST_ID" --paths "/*"
fi

echo "🎉 Frontend Deployment Successful!"

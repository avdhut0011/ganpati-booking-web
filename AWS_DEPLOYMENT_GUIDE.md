# 🌺 AWS Free Tier Production Deployment Guide — Ganpati Booking System

This guide walks you through deploying the complete application on the **AWS Free Tier (12 Months ₹0 Cost)** using enterprise AWS services.

---

## 🏗️ Architecture Overview

| Layer | AWS Service | AWS Free Tier Benefit |
|---|---|---|
| **Frontend Web App** | **AWS S3** + **AWS CloudFront** (CDN) | 5 GB Storage + 1 TB/month Data Transfer (Always Free) |
| **Backend API** | **AWS EC2** (`t2.micro` or `t3.micro` Ubuntu) | 750 Hours / month (24/7 Free) |
| **Photos & PDF Bills** | **AWS S3** (`USE_CLOUD_STORAGE=true`) | 5 GB Storage |
| **Database** | SQLite on 30GB EBS (or AWS RDS PostgreSQL) | 30 GB EBS Free / 750 Hrs RDS Free |
| **Security & SSL** | **AWS Certificate Manager (ACM)** | 100% Free Unlimited SSL (`https://`) |

---

## 🚀 Step 1: Launch Your AWS EC2 Instance (Free Tier)

1. Log in to the [AWS Management Console](https://aws.amazon.com/console/).
2. Select Region: **Asia Pacific (Mumbai) `ap-south-1`** (lowest latency for India).
3. Navigate to **EC2** > Click **Launch Instance**:
   - **Name:** `ganpati-booking-backend`
   - **OS:** `Ubuntu Server 22.04 LTS` or `24.04 LTS` (64-bit x86)
   - **Instance Type:** `t3.micro` or `t2.micro` (*Free tier eligible*)
   - **Key Pair:** Create a new key pair (e.g. `ganpati-key.pem`) and download it.
   - **Network Settings (Firewall / Security Group):**
     - Allow **SSH** (Port 22)
     - Allow **HTTP** (Port 80)
     - Allow **HTTPS** (Port 443)
     - Custom TCP: Port **8000** (Backend API)
   - **Storage:** `30 GiB` gp3 (Free Tier includes up to 30 GB).
4. Click **Launch Instance**.

---

## ⚡ Step 2: One-Click EC2 Server Setup

Connect to your EC2 instance via SSH:
```bash
ssh -i "ganpati-key.pem" ubuntu@<YOUR-EC2-PUBLIC-IP>
```

Run the automated server setup script:
```bash
# 1. Download setup script
curl -sSL https://raw.githubusercontent.com/<YOUR-REPO>/main/scripts/setup_aws_ec2.sh | bash

# 2. Clone your project repository
git clone https://github.com/<YOUR-REPO>/ganpati-web.git
cd ganpati-web

# 3. Configure production .env
cp backend/.env.production.example backend/.env
nano backend/.env  # Update JWT_SECRET and CORS_ORIGINS

# 4. Launch backend and web server with Docker Compose
docker compose up -d --build
```

Verify backend is live:
```bash
curl http://localhost:8000/
# Returns: {"message": "गणपती बाप्पा मोरया! 🌺 API is running."}
```

---

## ☁️ Step 3: Setup AWS S3 & CloudFront for Frontend

### 1. Create S3 Bucket for React Frontend
1. Open **S3** in AWS Console > **Create Bucket**.
2. Bucket Name: `ganpati-booking-frontend-2026` (Must be globally unique).
3. Region: `ap-south-1` (Mumbai).
4. Uncheck "Block all public access" or use CloudFront Origin Access Control (OAC).

### 2. Build and Upload Frontend
From your local machine or EC2:
```bash
# In frontend directory
npm install
npm run build

# Sync to S3
aws s3 sync dist/ s3://ganpati-booking-frontend-2026 --delete
```

### 3. Create CloudFront Distribution (CDN + HTTPS)
1. Navigate to **CloudFront** > **Create Distribution**.
2. **Origin Domain:** Select your S3 bucket `ganpati-booking-frontend-2026.s3.amazonaws.com`.
3. **Viewer Protocol Policy:** `Redirect HTTP to HTTPS`.
4. **Custom Error Responses:**
   - HTTP Error Code: `403` and `404`
   - Response Page Path: `/index.html`
   - HTTP Response Code: `200` *(Enables React Router client routing)*.
5. Click **Create Distribution**.
6. Your application will be live at `https://dXXXXXXXXXXXXX.cloudfront.net`!

---

## 📸 Step 4: (Optional) S3 Cloud Storage for Photos & Bills

To store statue photos and generated Marathi bill PDFs in AWS S3 instead of local disk:

1. Create a dedicated media bucket: `ganpati-statue-media-2026`.
2. Add S3 credentials to `backend/.env`:
```ini
USE_CLOUD_STORAGE=true
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=ganpati-statue-media-2026
```
3. Restart backend container:
```bash
docker compose restart backend
```

---

## 🔄 Moving from Free Tier to Production Paid Plan (When Client Approves)

| Action | Free Tier (Demo/Testing) | Paid Production (Client Live) |
|---|---|---|
| **EC2 Instance** | `t3.micro` (1 GB RAM) | Upgrade to `t3.small` or `t3.medium` (1-click resize in AWS console) |
| **Custom Domain** | `dXXXX.cloudfront.net` | Link `booking.yourstall.com` with free AWS ACM SSL |
| **Database** | SQLite / `db.t3.micro` | Enable Multi-AZ Automated Daily Backups on RDS |
| **Storage** | 5 GB S3 | Scales automatically without limits |

#!/bin/bash
# ==============================================================================
# 🌺 AWS EC2 UBUNTU 22.04/24.04 1-CLICK PRODUCTION SETUP SCRIPT
# ==============================================================================
set -e

echo "🚀 Starting Automated AWS EC2 Server Setup..."

# Update package lists and upgrade system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker & Docker Compose
echo "📦 Installing Docker and Docker Compose..."
sudo apt-get install -y ca-certificates curl gnupg lsb-release ufw git

sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Enable Docker without sudo for current user
sudo usermod -aG docker $USER
sudo systemctl enable docker
sudo systemctl start docker

# Configure UFW Firewall
echo "🔒 Configuring UFW Firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8000/tcp
sudo ufw --force enable

echo "✅ Server Setup Complete! You can now clone your repository and run: docker compose up -d --build"

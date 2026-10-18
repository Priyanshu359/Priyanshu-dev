# Production Deployment Guide: From Zero to Live (100% Free Tier)

This guide is a complete, step-by-step numbered checklist designed for deploying the entire `priyanshu.dev` distributed platform to production for the first time. Every step explains **what it does**, **the exact commands to run**, and **how to verify it worked**.

---

## Architecture Overview

```
                      ┌─────────────────────────────────────────────────────────────┐
                      │                   Cloudflare DNS & Edge                     │
                      │       (Domain Registrar, DNS, Edge SSL & Turnstile)         │
                      └──────────────┬───────────────────────────────┬──────────────┘
                                     │                               │
                       DNS-Only (Grey Cloud)                   Proxied (Orange Cloud)
                                     │                               │
                                     ▼                               ▼
                      ┌─────────────────────────────┐ ┌─────────────────────────────┐
                      │       Vercel (Free)         │ │   Oracle Cloud VM (Free)    │
                      │    Next.js 15 Frontend      │ │    Ampere A1 ARM64 (24/7)   │
                      │                             │ │  ┌───────────────────────┐  │
                      │  https://priyanshu.dev      │ │  │   Caddy HTTPS Proxy   │  │
                      │  https://www.priyanshu.dev  │ │  └───────────┬───────────┘  │
                      │                             │ │              │ :8080        │
                      │                             │ │  ┌───────────▼───────────┐  │
                      │                             │ │  │   Spring Boot 3.4     │  │
                      │                             │ │  │      (Modular API)    │  │
                      │                             │ │  └─────┬───────────┬─────┘  │
                      │                             │ │        │           │        │
                      └─────────────────────────────┘ │  ┌─────▼─────┐ ┌───▼─────┐  │
                                                      │  │  Redis 7  │ │ Outbox  │  │
                                                      │  │ (Docker)  │ │ Consumer│  │
                                                      │  └───────────┘ └─────────┘  │
                                                      └──────────────┬──────────────┘
                                                                     │ JDBC SSL
                                                      ┌──────────────▼──────────────┐
                                                      │   Supabase PostgreSQL 16    │
                                                      │  (pgvector, app & lab, RLS) │
                                                      └─────────────────────────────┘
```

---

## Pre-Deployment Checklist & Environment Variables

Replace placeholders with your real values:

| Variable | Description | Example |
|---|---|---|
| `<your-domain>` | Root domain | `priyanshu.dev` |
| `api.<your-domain>` | API subdomain | `api.priyanshu.dev` |
| `<vm-ip>` | Public IPv4 of Oracle Cloud VM | `129.153.xx.xx` |
| `<db-password>` | Supabase database master password | (generated) |

---

## Step 1: Provision Supabase PostgreSQL Database

**What this does**: Sets up a managed PostgreSQL 16 database with the `pgvector` extension, isolated `app` and `lab` schemas, and Row Level Security (RLS). Flyway automatically runs database migrations on API startup.

### 1.1 Create Project
1. Log in to [Supabase](https://supabase.com) and click **New project**.
2. **Name**: `priyanshu-prod`
3. **Database Password**: Generate a secure password and save it in a password manager.
4. **Region**: Choose the closest region to your intended Oracle Cloud VM (e.g., `ap-south-1` Mumbai or `us-east-1` N. Virginia).
5. Click **Create new project** and wait 2 minutes for provisioning.

### 1.2 Enable Vector Extension
1. In the Supabase Dashboard, go to **Database** → **Extensions**.
2. Search for `vector` and toggle it **ON**.

### 1.3 Get Connection Details
1. Go to **Project Settings** → **Database**.
2. Under **Connection string**, select the **URI** tab.
3. Switch from "Direct" to **Session pooler** (Port 5432) or use the Direct connection string:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require
   ```
4. Note the JDBC format for Spring Boot:
   ```
   jdbc:postgresql://aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require
   ```

### 1.4 Verification
Verify that the database is accessible:
```bash
pg_isready -d "postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require"
# Output should be: ... accepting connections
```

---

## Step 2: Configure Cloudflare DNS & SSL

**What this does**: Configures DNS routing for the domain. Vercel requires direct DNS records (Grey Cloud / DNS Only) for Let's Encrypt SSL issuance. The backend API is proxied (Orange Cloud) for Cloudflare DDoS protection, CDN edge caching, and Turnstile bot protection.

### 2.1 Set Up Nameservers
1. In Cloudflare, add your site `<your-domain>`.
2. Update your registrar's nameservers to Cloudflare's assigned nameservers.
3. Go to **SSL/TLS** → Overview, and set encryption mode to **Full (strict)**.

### 2.2 Add DNS Records
In **Cloudflare** → **DNS** → **Records**, create the following 3 records:

| Type | Name | Content / Target | Proxy status | Purpose |
|---|---|---|---|---|
| `CNAME` | `@` | `cname.vercel-dns.com` | **DNS only (Grey Cloud)** | Root frontend |
| `CNAME` | `www` | `cname.vercel-dns.com` | **DNS only (Grey Cloud)** | WWW redirect |
| `A` | `api` | `<vm-ip>` | **Proxied (Orange Cloud)** | Backend API |

> [!IMPORTANT]
> **Vercel requires DNS Only (Grey Cloud)** for `@` and `www`. If proxied through Cloudflare, Vercel cannot verify ownership or issue automatic SSL certificates. The `api` record **must be Proxied (Orange Cloud)**.

### 2.3 Set Up Cloudflare Turnstile (Bot Protection)
1. In Cloudflare dashboard, navigate to **Turnstile** → **Add site**.
2. **Site name**: `priyanshu-portfolio`
3. **Domain**: `<your-domain>`
4. **Widget Mode**: Managed.
5. Save your **Site Key** (`0x4AAAAAA...`) and **Secret Key** (`0x4AAAAAA...`).

### 2.4 Verification
```bash
dig +short <your-domain>
# Returns Vercel's Anycast IP addresses (76.76.21.21)

dig +short api.<your-domain>
# Returns Cloudflare edge proxy IPs
```

---

## Step 3: Provision Oracle Cloud Always Free VM (Ampere A1 ARM)

**What this does**: Deploys an Always Free cloud VM featuring 2 ARM64 OCPUs and 12 GB RAM with Ubuntu 24.04.

### 3.1 Create Compute Instance
1. Log in to [Oracle Cloud Console](https://cloud.oracle.com).
2. Go to **Compute** → **Instances** → **Create instance**.
3. **Name**: `priyanshu-api-vm`
4. **Placement**: Choose an Availability Domain showing "Always Free Eligible".
5. **Image and shape**:
   - Image: `Canonical Ubuntu 24.04 Minimal aarch64`
   - Shape: Click **Change shape** → **Ampere** (ARM processor) → `VM.Standard.A1.Flex`
   - Set **OCPUs**: `2`, **Memory**: `12 GB`. (Always Free allows up to 4 OCPUs and 24 GB).
6. **Networking**: Create new Virtual Cloud Network (VCN) with public subnet. Select **Assign a public IPv4 address**.
7. **Add SSH keys**:
   - Select **Generate a key pair for me** and download both private and public keys, OR paste your existing public key (`~/.ssh/id_ed25519.pub`).
8. Click **Create** and wait for instance status to show **Running**. Note the **Public IP address**.

### 3.2 Open VCN Security List Ports
Oracle Cloud blocks external traffic by default in its Virtual Cloud Network:
1. In the instance details, click on the **Subnet** link under Primary VNIC.
2. Click on the **Default Security List for...**.
3. Under **Ingress Rules**, click **Add Ingress Rules**:
   - **Source CIDR**: `0.0.0.0/0`
   - **IP Protocol**: `TCP`
   - **Destination Port Range**: `80,443`
   - **Description**: `HTTP and HTTPS for Caddy web server`
4. Click **Add Ingress Rules**.

### 3.3 Configure Host Firewall (`ufw`)
Connect to your VM from your local machine:
```bash
ssh -i ~/.ssh/oracle_vps.key ubuntu@<vm-ip>
```
Once logged in, open ports in Ubuntu's firewall:
```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save

# Or if using ufw:
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3.4 Verification
```bash
ssh -i ~/.ssh/oracle_vps.key ubuntu@<vm-ip> "echo 'VM SSH Connection Verified'"
```

---

## Step 4: Install Docker & Deploy Backend on the VM

**What this does**: Installs Docker and Docker Compose on ARM64 Ubuntu, configures the production environment secrets, starts Caddy (which automatically provisions a valid Let's Encrypt SSL certificate for `api.<your-domain>`), the Spring Boot API, and Redis.

### 4.1 Install Docker Engine on VM
Run the official Docker convenience script on the VM:
```bash
# On the Oracle VM:
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
newgrp docker
docker --version
docker compose version
```

### 4.2 Clone Deployment Files
```bash
mkdir -p /home/ubuntu/app
cd /home/ubuntu/app
git clone https://github.com/priyanshu-sinha/priyanshu-dev.git .
cd infra/production
```

### 4.3 Create `.env` on VM (Never committed to Git)
Create `/home/ubuntu/app/infra/production/.env`:
```bash
cat << 'EOF' > /home/ubuntu/app/infra/production/.env
DOMAIN=priyanshu.dev
ACME_EMAIL=priyanshu.kr.sinha74@gmail.com

# Supabase Postgres Connection
DATABASE_URL=jdbc:postgresql://aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require
POSTGRES_USER=postgres.[PROJECT-REF]
POSTGRES_PASSWORD=[YOUR_SUPABASE_PASSWORD]

# Redis Cache
REDIS_PASSWORD=

# Security & Cloudflare Turnstile
TURNSTILE_SECRET_KEY=0x4AAAAAA...
NOTIFICATION_LOG_ONLY=true

# GitHub Container Registry Image
API_IMAGE=ghcr.io/priyanshu-sinha/priyanshu-dev/api:latest
EOF
chmod 600 /home/ubuntu/app/infra/production/.env
```

### 4.4 Start Services
```bash
cd /home/ubuntu/app/infra/production
docker compose up -d
```

### 4.5 Verification
```bash
# 1. Check container health
docker compose ps
# Output: caddy-proxy (Up), priyanshu-api (healthy), priyanshu-redis (healthy)

# 2. Check local health endpoint
curl -i http://localhost:8080/actuator/health
# HTTP/1.1 200 OK {"status":"UP"}

# 3. Check public HTTPS endpoint
curl -i https://api.priyanshu.dev/actuator/health
# HTTP/2 200 ... {"status":"UP"}
```

---

## Step 5: Deploy Frontend to Vercel

**What this does**: Connects Vercel to your GitHub repository for continuous deployment, builds the Next.js 15 application, and binds `priyanshu.dev` and `www.priyanshu.dev`.

### 5.1 Import Project into Vercel
1. Log in to [Vercel](https://vercel.com) with GitHub.
2. Click **Add New...** → **Project**.
3. Select `priyanshu-dev`.
4. Configure Project Settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click edit and select `apps/web`
   - **Build Command**: `pnpm --filter web build` (or leave default `next build`)
   - **Install Command**: `pnpm install`

### 5.2 Configure Environment Variables
In the Vercel project configuration, add:

| Key | Value | Environment |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.<your-domain>` | Production, Preview, Development |
| `NEXT_PUBLIC_SITE_URL` | `https://<your-domain>` | Production |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `0x4AAAAAA...` (Turnstile site key) | Production, Preview |

5. Click **Deploy**. Vercel will build the frontend and assign an initial `*.vercel.app` URL.

### 5.3 Bind Custom Domains
1. In Vercel, go to **Settings** → **Domains**.
2. Add `<your-domain>` (e.g. `priyanshu.dev`).
3. Add `www.<your-domain>`. Select redirect to `priyanshu.dev`.
4. Vercel will verify the Cloudflare DNS-Only CNAME records created in Step 2. Within 60 seconds, both domains will show green checkmarks (Valid Configuration).

### 5.4 Verification
Open `https://<your-domain>` in your browser. Verify the home page loads, the theme toggle works, and requests go to `https://api.<your-domain>`.

---

## Step 6: Configure GitHub Actions CI/CD Secrets

**What this does**: Automates building multi-arch container images (`linux/amd64` and `linux/arm64`), publishing them to GitHub Container Registry (`ghcr.io`), and automatically running zero-downtime rolling deploys to the Oracle VM whenever code merges into `main`.

1. In GitHub, go to your repository **Settings** → **Secrets and variables** → **Actions**.
2. Click **New repository secret** and add:
   - `VM_HOST`: Public IP of your Oracle VM (`<vm-ip>`)
   - `VM_USER`: `ubuntu`
   - `VM_SSH_KEY`: The entire private SSH key (`-----BEGIN OPENSSH PRIVATE KEY----- ...`)
   - `TURNSTILE_SECRET_KEY`: Your Cloudflare Turnstile secret key

### Verification
Make a commit to `main`. Go to the **Actions** tab in GitHub:
- `CI` workflow passes (`web`, `api`, `security`).
- `Deploy API to Oracle Cloud VM` workflow builds the multi-arch image, pushes to `ghcr.io`, SSHs into the VM, pulls the image, and verifies container health.

---

## Step 7: Observability Setup (Grafana Cloud Free Tier)

**What this does**: Connects free application telemetry (Spring Boot Micrometer Prometheus metrics, JVM memory, HTTP request rates, and HikariCP connection pools) to Grafana Cloud.

1. Sign up for a free account at [Grafana Cloud](https://grafana.com/products/cloud/).
2. Under **Connections** → **Add new connection**, select **Hosted Prometheus metrics**.
3. Generate an API token and copy the Remote Write endpoint URL and credentials.
4. The Spring Boot backend exposes metrics natively at:
   ```
   https://api.<your-domain>/actuator/prometheus
   ```
5. In Grafana Cloud, import dashboard ID **12900** (Spring Boot 3 Statistics) or ID **4701** (JVM Micrometer).

---

## Step 8: End-to-End Production Verification Checklist

Run these terminal checks to prove production readiness:

```bash
# 1. API Root Health
curl -s https://api.<your-domain>/ | jq .
# Expected: { "service": "priyanshu-api", "status": "foundation ok" }

# 2. Public System Stats
curl -s https://api.<your-domain>/stats | jq .
# Expected: { "requestsServed": ..., "cacheHits": ..., "rateLimitsTriggered": ... }

# 3. Developer Profile
curl -s https://api.<your-domain>/me | jq .name
# Expected: "Priyanshu Sinha"

# 4. Interactive Ask Pipeline (SSE Stream)
curl -N -X POST https://api.<your-domain>/ask \
  -H "Content-Type: application/json" \
  -d '{"q":"How does he use Redis?"}'
# Expected: Real-time event stream emitting stage.started, stage.done, pipeline.done

# 5. Public Status Page
curl -s -I https://<your-domain>/status
# Expected: HTTP/2 200 OK
```

---

## Plan B: Render Web Service + Upstash Redis Fallback

If Oracle Cloud Always Free ARM capacity is temporarily unavailable in your region, follow this fallback plan:

### 1. Backend on Render (Free Web Service)
1. Log in to [Render](https://render.com) and click **New** → **Web Service**.
2. Connect your GitHub repository.
3. **Environment**: Docker (Runtime uses `services/api/Dockerfile`).
4. **Root Directory**: `services/api`
5. **Instance Type**: Free (512 MB RAM, 0.1 CPU).
6. **Environment Variables**:
   - `DATABASE_URL`: Your Supabase connection string.
   - `REDIS_HOST`: Upstash Redis host (e.g., `flowing-frog-12345.upstash.io`).
   - `REDIS_PORT`: `6379`
   - `REDIS_PASSWORD`: Upstash Redis token.
   - `CORS_ALLOWED_ORIGINS`: `https://<your-domain>,https://www.<your-domain>`

### 2. Redis on Upstash (Serverless Free Tier)
1. Log in to [Upstash](https://upstash.com) and click **Create Database**.
2. **Name**: `priyanshu-cache`
3. **Region**: Match your Supabase region.
4. Copy the Redis endpoint host, port, and password to Render's environment variables.

> [!NOTE]
> **Render Free Cold Start Handling**: Free web services on Render spin down after 15 minutes of inactivity. The first request after idle can take ~40 seconds. Both the Home Hero and the AI walkthrough frontend explicitly handle this with a fallback labelled **"replay of a real request"**, ensuring visitors never encounter a broken interface while the backend boots up.

# Production Deployment Guide: 100% Free Tier (Zero Payment Verification Required)

This guide is a complete, step-by-step checklist designed for deploying the entire **`priyanshusinha.dev`** distributed platform to production. 

> [!TIP]
> **Zero Credit / Debit Card Verification**: Unlike AWS, Google Cloud, or Oracle Cloud (which mandate credit card validation during registration), every provider in this primary guide (**Render**, **Vercel**, **Supabase**, **Upstash Redis**, **Cloudflare**, and **cron-job.org**) offers a genuine **100% free tier with zero payment verification**.

---

## Production URLs & Domains

| Component | Public URL | Hosting Provider | How It Is Created & Routed |
|---|---|---|---|
| **Frontend (Root)** | `https://priyanshusinha.dev` | Vercel (Hobby Free) | Cloudflare DNS-Only CNAME `@` → `cname.vercel-dns.com`. Vercel auto-provisions SSL. |
| **Frontend (Redirect)** | `https://www.priyanshusinha.dev` | Vercel (Hobby Free) | Cloudflare DNS-Only CNAME `www` → `cname.vercel-dns.com`. Vercel 308 redirects to root. |
| **Backend API** | `https://api.priyanshusinha.dev` | Render (Free Web Service) | Cloudflare CNAME `api` → `<render-app>.onrender.com`. Render auto-provisions SSL. |
| **Database** | `aws-0-[REGION].pooler.supabase.com` | Supabase (Free Tier) | Managed PostgreSQL 16 with `pgvector` & Session Pooler (port 5432 / 6543). |
| **Distributed Cache & Locks**| `[NAME].upstash.io:6379` | Upstash (Free Tier) | Serverless Redis with TLS encryption (10,000 commands/day free). |
| **Keep-Alive Health Loop** | Background Ping (Every 1m) | cron-job.org / GitHub Actions | Pings `/actuator/health` to keep Render container active 24/7 without sleeping. |

---

## Architecture Overview

```
                      ┌─────────────────────────────────────────────────────────────┐
                      │                   Cloudflare DNS & Edge                     │
                      │               (DNS Management & Turnstile)                  │
                      └──────────────┬───────────────────────────────┬──────────────┘
                                     │                               │
                        CNAME @, www (DNS-Only)                  CNAME api (DNS-Only)
                                     │                               │
                                     ▼                               ▼
                      ┌─────────────────────────────┐ ┌─────────────────────────────┐
                      │        Vercel Free          │ │         Render Free         │
                      │     Next.js 15 Frontend     │ │     Spring Boot 3.4 API     │
                      │                             │ │                             │
                      │  https://priyanshusinha.dev │ │ https://api.priyanshusinha  │
                      │  https://www.priyanshusinha │ │             .dev            │
                      │              .dev           │ │                             │
                      └─────────────────────────────┘ └──────┬───────────────┬──────┘
                                                             │               │
                                                     TLS     │               │ JDBC SSL
                                                     ┌───────▼───────┐ ┌─────▼───────────────────────┐
                                                     │ Upstash Redis │ │    Supabase PostgreSQL 16   │
                                                     │  (Serverless) │ │   (pgvector, app & lab, RLS)│
                                                     └───────────────┘ └─────────────────────────────┘
                                                             ▲
                                                             │ Every 1 Min Ping
                                                     ┌───────┴───────┐
                                                     │ cron-job.org  │
                                                     │ (Keep-Alive)  │
                                                     └───────────────┘
```

---

## Pre-Deployment Checklist & Environment Variables

| Variable | Description | Exact Value for Production |
|---|---|---|
| `DOMAIN` | Root domain | `priyanshusinha.dev` |
| `API_DOMAIN` | API subdomain | `api.priyanshusinha.dev` |
| `NEXT_PUBLIC_SITE_URL` | Frontend URL for metadata / sitemap | `https://priyanshusinha.dev` |
| `NEXT_PUBLIC_API_URL` | Frontend API Target URL | `https://api.priyanshusinha.dev` |
| `CORS_ALLOWED_ORIGINS` | Permitted browser origins | `https://priyanshusinha.dev,https://www.priyanshusinha.dev` |

---

## Step 1: Provision Supabase PostgreSQL Database (No Card Needed)

**What this does**: Sets up a free PostgreSQL 16 database with the `pgvector` extension, isolated `app` and `lab` schemas, and Row Level Security (RLS). Flyway automatically runs database migrations on API startup.

### 1.1 Create Project
1. Log in to [Supabase](https://supabase.com) with GitHub (no credit card required).
2. Click **New project**.
3. **Name**: `priyanshusinha-prod`
4. **Database Password**: Generate a secure password and save it in a password manager.
5. **Region**: Choose a region close to your users (e.g., `ap-south-1` Mumbai, `us-east-1` N. Virginia, or `eu-central-1` Frankfurt).
6. Click **Create new project** and wait ~2 minutes.

### 1.2 Enable Vector Extension
1. In the Supabase Dashboard, navigate to **Database** → **Extensions**.
2. Search for `vector` and toggle it **ON**.

### 1.3 Copy Connection String
1. Go to **Project Settings** → **Database**.
2. Under **Connection string**, select the **URI** tab.
3. Switch from "Direct" to **Session pooler** (Port 5432):
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require
   ```
4. Note the Spring Boot JDBC format:
   ```
   jdbc:postgresql://aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require
   ```

---

## Step 2: Provision Upstash Redis (No Card Needed)

**What this does**: Provides serverless Redis 7 with automatic TLS encryption for distributed rate limiting, semantic caching, sliding window metrics, and idempotency locks.

1. Sign up at [Upstash](https://upstash.com) with GitHub (no credit card required).
2. Click **Create Database**.
3. **Name**: `priyanshu-redis`
4. **Type**: Regional (choose the same or closest region as your Supabase database).
5. **TLS (SSL)**: Enabled.
6. Click **Create**.
7. In the database **Details** page, copy:
   - **Endpoint / Host**: (e.g. `flowing-frog-12345.upstash.io`)
   - **Port**: `6379`
   - **Password**: The primary token/password string.

---

## Step 3: Configure Cloudflare DNS for `priyanshusinha.dev`

**What this does**: Manages DNS routing for `priyanshusinha.dev` and `api.priyanshusinha.dev`.

### 3.1 Point Nameservers to Cloudflare
1. Log in to [Cloudflare](https://dash.cloudflare.com) and click **Add a site** → enter **`priyanshusinha.dev`**.
2. Select the **Free** plan.
3. In your domain registrar (Namecheap, GoDaddy, Hostinger, Porkbun, etc.), set nameservers to Cloudflare's two assigned nameservers.
4. In Cloudflare, navigate to **SSL/TLS** → set encryption mode to **Full** (or **Full (strict)**).

### 3.2 Add DNS Records

In Cloudflare **DNS** → **Records**, create the following records:

| Type | Name | Content / Target | Proxy Status | Purpose |
|---|---|---|---|---|
| `CNAME` | `@` | `cname.vercel-dns.com` | **DNS Only (Grey Cloud)** | Primary frontend (`https://priyanshusinha.dev`) |
| `CNAME` | `www` | `cname.vercel-dns.com` | **DNS Only (Grey Cloud)** | WWW redirect (`https://www.priyanshusinha.dev`) |
| `CNAME` | `api` | `[YOUR-RENDER-APP-NAME].onrender.com` | **DNS Only (Grey Cloud)** | Backend API (`https://api.priyanshusinha.dev`) |

> [!IMPORTANT]
> **Use DNS Only (Grey Cloud)** for both Vercel (`@`, `www`) and Render (`api`). This allows Vercel and Render to directly verify domain ownership via Let's Encrypt and automatically issue valid SSL certificates without proxy negotiation issues.

### 3.3 Set Up Cloudflare Turnstile (Bot Protection)
1. In Cloudflare dashboard, navigate to **Turnstile** → **Add site**.
2. **Site name**: `priyanshu-portfolio`
3. **Domain**: `priyanshusinha.dev`
4. **Widget Mode**: Managed.
5. Save your **Site Key** (`0x4AAAAAA...`) and **Secret Key** (`0x4AAAAAA...`).

---

## Step 4: Deploy Backend to Render (`api.priyanshusinha.dev`)

**What this does**: Builds and deploys the containerized Spring Boot API onto Render's free cloud runtime without requiring any payment verification.

### 4.1 Create Web Service on Render
1. Log in to [Render](https://render.com) with GitHub (no credit card required).
2. Click **New +** → **Web Service**.
3. Select **Build and deploy from a Git repository** → select `Priyanshu359/Priyanshu-dev`.
4. Configure service settings:
   - **Name**: `priyanshu-api`
   - **Region**: Choose closest to your Supabase database (e.g. Frankfurt, Oregon, Ohio, Singapore).
   - **Branch**: `main` (or your current branch)
   - **Root Directory**: Leave blank (or `.`)
   - **Runtime**: **Docker**
   - **Dockerfile Path**: `./services/api/Dockerfile`
   - **Instance Type**: **Free** (0.1 CPU, 512 MB RAM)

### 4.2 Add Environment Variables
In the Render service configuration under **Environment Variables**, add:

| Key | Value | Notes |
|---|---|---|
| `PORT` | `8080` | Render forwards external HTTPS to this container port |
| `SERVER_PORT` | `8080` | Spring Boot HTTP port |
| `SPRING_PROFILES_ACTIVE` | `prod` | Production Spring profile |
| `DATABASE_URL` | `jdbc:postgresql://aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require` | From Supabase Session Pooler |
| `POSTGRES_USER` | `postgres.[PROJECT-REF]` | From Supabase |
| `POSTGRES_PASSWORD` | `[YOUR_SUPABASE_PASSWORD]` | From Supabase |
| `FLYWAY_ENABLED` | `true` | Runs database migrations on startup |
| `REDIS_HOST` | `[NAME].upstash.io` | From Upstash Redis |
| `REDIS_PORT` | `6379` | Standard Redis port |
| `REDIS_PASSWORD` | `[YOUR_UPSTASH_PASSWORD]` | From Upstash Redis |
| `REDIS_SSL` | `true` | Required for Upstash TLS connection |
| `CORS_ALLOWED_ORIGINS` | `https://priyanshusinha.dev,https://www.priyanshusinha.dev` | Whitelist frontend browser calls |
| `TURNSTILE_SECRET_KEY` | `0x4AAAAAA...` | From Cloudflare Turnstile |
| `NOTIFICATION_LOG_ONLY` | `true` | Dispatches contact emails to logs |

5. Click **Create Web Service**. Render will start building the multi-stage Docker image. Once complete, it will report `Service is live`.

### 4.3 Bind Custom Domain `api.priyanshusinha.dev`
1. In your Render service, go to **Settings** → **Custom Domains**.
2. Click **Add Custom Domain** and enter **`api.priyanshusinha.dev`**.
3. Render will display your unique CNAME target (e.g., `priyanshu-api-xyz.onrender.com`).
4. Ensure your Cloudflare DNS record for `api` has this exact target with **DNS Only (Grey Cloud)**.
5. Within 1–2 minutes, Render will verify DNS and issue a free Let's Encrypt certificate.

### 4.4 Verify API is Live
```bash
curl -i https://api.priyanshusinha.dev/actuator/health
# HTTP/2 200 OK
# {"status":"UP","components":{"db":{"status":"UP"},"redis":{"status":"UP"}}}
```

---

## Step 5: Anti-Sleep Health Loop (Keep Render Awake 24/7)

> [!IMPORTANT]
> **Why this is needed**: Free web services on Render go to sleep after 15 minutes of inactivity. When a user visits a sleeping service, waking up the Spring Boot JVM takes ~40 seconds.
> 
> By configuring an external health loop that pings `/actuator/health` every 1 to 5 minutes, **your Render service will never idle and stays awake 24/7 with zero latency cold starts**.

Choose either Method A (recommended for 1-minute precision) or Method B:

### Method A: Free Ping via `cron-job.org` (Every 1 Minute — Recommended)
1. Sign up for free at [cron-job.org](https://cron-job.org) (100% free, no credit card).
2. Click **Create Cronjob**.
3. **Title**: `Priyanshu API Keep-Alive`
4. **URL**: `https://api.priyanshusinha.dev/actuator/health`
5. **Execution Schedule**:
   - Choose: **Every 1 minute** (or **Every 5 minutes**).
6. **Request Method**: `GET`
7. Click **Create**.
8. It will immediately begin firing a lightweight HTTP GET request every 60 seconds, resetting Render's 15-minute timer so it **never sleeps**.

### Method B: Free Ping via `UptimeRobot` (Every 5 Minutes + Outage Monitoring)
1. Sign up at [UptimeRobot](https://uptimerobot.com) (free plan includes 50 monitors).
2. Click **Add New Monitor**:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `Priyanshu Production API`
   - **URL**: `https://api.priyanshusinha.dev/actuator/health`
   - **Monitoring Interval**: `5 minutes`
3. Click **Create Monitor**.
4. In addition to keeping Render awake, UptimeRobot will automatically notify you by email if your API ever goes down.

### Method C: GitHub Actions Schedule Workflow (Built-in)
The repository includes a ready-to-run GitHub Actions workflow at [`.github/workflows/keep-alive.yml`](file:///Users/adda247/Desktop/priyanshu-dev/.github/workflows/keep-alive.yml) which pings `https://api.priyanshusinha.dev/actuator/health` every 10 minutes automatically.

---

## Step 6: Deploy Frontend to Vercel (`https://priyanshusinha.dev`)

**What this does**: Connects Vercel to your GitHub repository for continuous deployment, builds the Next.js 15 application, and binds both **`priyanshusinha.dev`** and **`www.priyanshusinha.dev`**.

### 6.1 Import Project into Vercel
1. Log in to [Vercel](https://vercel.com) with GitHub (no credit card required).
2. Click **Add New...** → **Project**.
3. Select `Priyanshu359/Priyanshu-dev`.
4. Configure Project Settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click edit and select **`apps/web`**
   - **Build Command**: `pnpm --filter web build` (or leave default `next build`)
   - **Install Command**: `pnpm install`

### 6.2 Configure Environment Variables in Vercel
Add the following variables:

| Key | Value | Environment |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://priyanshusinha.dev` | Production |
| `NEXT_PUBLIC_API_URL` | `https://api.priyanshusinha.dev` | Production, Preview, Development |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `0x4AAAAAA...` (Turnstile Site Key) | Production, Preview |

Click **Deploy**.

### 6.3 Bind Custom Domains in Vercel
1. In Vercel Project → **Settings** → **Domains**:
2. Add **`priyanshusinha.dev`**:
   - Vercel checks the Cloudflare DNS `@` CNAME record (`cname.vercel-dns.com`).
3. Add **`www.priyanshusinha.dev`**:
   - Choose: **Redirect to priyanshusinha.dev** (308 Permanent Redirect).
4. Within 30–60 seconds, both domains will display a green checkmark: **Valid Configuration**.

---

## Step 7: End-to-End Production Verification Checklist

Run these terminal checks from your local machine to verify the live production system:

```bash
# 1. Frontend Root Status
curl -s -I https://priyanshusinha.dev | grep -i HTTP
# Expected: HTTP/2 200

# 2. WWW Redirect Status
curl -s -I https://www.priyanshusinha.dev | grep -i -E "HTTP|location"
# Expected: HTTP/2 308, location: https://priyanshusinha.dev/

# 3. Backend API Root Health
curl -s https://api.priyanshusinha.dev/ | jq .
# Expected: { "service": "priyanshu-api", "status": "foundation ok" }

# 4. Public System Stats
curl -s https://api.priyanshusinha.dev/stats | jq .
# Expected: { "requestsServed": ..., "cacheHits": ..., "rateLimitsTriggered": ... }

# 5. Developer Profile
curl -s https://api.priyanshusinha.dev/me | jq .name
# Expected: "Priyanshu Sinha"

# 6. Interactive Ask Pipeline (SSE Stream)
curl -N -X POST https://api.priyanshusinha.dev/ask \
  -H "Content-Type: application/json" \
  -d '{"q":"How does he use Redis?"}'
# Expected: Real-time event stream emitting stage.started, stage.done, pipeline.done

# 7. Interactive Lab Circuit Breaker Call
curl -s https://api.priyanshusinha.dev/lab/circuit-breaker/call | jq .
# Expected: { "state": "CLOSED", "downstreamHealthy": true, ... }
```

---

## Optional Alternative: Oracle Cloud Always Free VM (For Users with Verified Card)

If you already possess a credit-card-verified Oracle Cloud account and prefer hosting the backend on a dedicated 24/7 ARM64 VM (`VM.Standard.A1.Flex`, 2 OCPUs, 12 GB RAM) with Caddy reverse proxy:

1. Refer to [infra/production/docker-compose.yml](file:///Users/adda247/Desktop/priyanshu-dev/infra/production/docker-compose.yml) and [infra/production/Caddyfile](file:///Users/adda247/Desktop/priyanshu-dev/infra/production/Caddyfile).
2. Point Cloudflare DNS `api` record (Type `A`) to your VM's public IPv4 address.
3. Caddy will automatically issue SSL for `api.priyanshusinha.dev` via HTTP-01 ACME challenges.

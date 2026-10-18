import { siteConfig } from "@/config/site";
import type { ProfileContent } from "@/content/schema";

export interface AskRequest {
  question: string;
  sessionId?: string;
}

export interface AskResponse {
  answer: string;
  cached: boolean;
  rateLimited: boolean;
  timings: {
    cacheLookupMs: number;
    retrievalMs: number;
    modelLatencyMs: number;
    totalMs: number;
  };
  sources?: Array<{
    title: string;
    slug: string;
    similarity: number;
  }>;
}

export interface HireMeRequest {
  name: string;
  email: string;
  type: "recruiter" | "client" | "student";
  company?: string;
  role?: string;
  projectType?: string;
  timeline?: string;
  stage?: string;
  topic?: string;
  message: string;
}

export interface HireMeResponse {
  status: "accepted" | "rejected";
  message: string;
  retryAfterSeconds?: number;
}

export interface LabRateLimitResponse {
  allowed: boolean;
  remainingTokens: number;
  capacity: number;
  status: string;
  retryAfterSeconds?: number;
}

class ApiClient {
  private get baseUrl(): string {
    return siteConfig.apiUrl;
  }

  async getProfile(): Promise<ProfileContent> {
    const res = await fetch(`${this.baseUrl}/api/me`);
    if (!res.ok) throw new Error(`Failed to fetch profile: ${res.statusText}`);
    return res.json();
  }

  async ask(req: AskRequest): Promise<AskResponse> {
    const res = await fetch(`${this.baseUrl}/api/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error(`Ask API failed: ${res.statusText}`);
    return res.json();
  }

  async hireMe(req: HireMeRequest): Promise<HireMeResponse> {
    const res = await fetch(`${this.baseUrl}/api/hire-me`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error(`Hire API failed: ${res.statusText}`);
    return res.json();
  }

  async checkRateLimit(): Promise<LabRateLimitResponse> {
    const res = await fetch(`${this.baseUrl}/api/lab/limited`);
    return {
      allowed: res.status !== 429,
      remainingTokens: parseInt(res.headers.get("X-RateLimit-Remaining") || "0", 10),
      capacity: 5,
      status: res.status === 200 ? "200 OK" : "429 Too Many Requests",
      retryAfterSeconds: parseInt(res.headers.get("Retry-After") || "0", 10),
    };
  }
}

export const apiClient = new ApiClient();

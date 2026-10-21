/**
 * Centralized API configuration.
 * Points to the Spring Boot backend service on port 3333 by default in local dev.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

import { NextResponse } from "next/server";
import { getProfile } from "@/content";

export async function GET() {
  const profile = getProfile();
  return NextResponse.json({
    name: profile.name,
    role: profile.role,
    stack: profile.stack,
    openTo: profile.openTo,
    hireMe: profile.hireMe,
  });
}

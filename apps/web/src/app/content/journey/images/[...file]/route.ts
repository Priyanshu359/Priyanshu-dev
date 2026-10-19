import fs from "node:fs";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ file: string[] }> }
) {
  const resolvedParams = await params;
  const fileName = resolvedParams.file.join("/");

  // Look in content/journey/images/
  // Resolve from project root
  const rootDir = path.resolve(process.cwd(), "../..");
  let filePath = path.join(rootDir, "content/journey/images", fileName);

  if (!fs.existsSync(filePath)) {
    // Also try relative to process.cwd() (if process.cwd is apps/web or root)
    const directPath = path.resolve(process.cwd(), "content/journey/images", fileName);
    if (fs.existsSync(directPath)) {
      filePath = directPath;
    } else {
      return new NextResponse("Image not found", { status: 404 });
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentTypeMap: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".avif": "image/avif",
  };
  const contentType = contentTypeMap[ext] || "application/octet-stream";

  const buffer = fs.readFileSync(filePath);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

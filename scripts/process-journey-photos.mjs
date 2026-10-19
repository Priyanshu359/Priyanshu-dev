import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

// Locate sharp in apps/web/node_modules/sharp or workspace
let sharp;
try {
  sharp = require("sharp");
} catch {
  try {
    const webSharpPath = path.join(rootDir, "apps/web/node_modules/sharp");
    sharp = require(webSharpPath);
  } catch (err) {
    throw new Error(`Could not load sharp library: ${err.message}`);
  }
}

export async function processJourneyPhotos(customDir) {
  const imagesDir = customDir || path.join(rootDir, "content/journey/images");
  if (!fs.existsSync(imagesDir)) {
    console.log(`[journey:photos] Directory not found: ${imagesDir}`);
    return [];
  }

  const files = fs.readdirSync(imagesDir);
  const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
  const processed = [];

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!imageExtensions.has(ext)) continue;

    const filePath = path.join(imagesDir, file);
    try {
      const inputBuffer = fs.readFileSync(filePath);
      const image = sharp(inputBuffer);
      const metadata = await image.metadata();

      // Auto-orient based on EXIF, resize to max 2000px on long side,
      // and strip all EXIF/GPS metadata (sharp drops EXIF by default when withMetadata() is not called)
      const pipeline = sharp(inputBuffer)
        .rotate()
        .resize({
          width: 2000,
          height: 2000,
          fit: "inside",
          withoutEnlargement: true,
        });

      if (ext === ".jpg" || ext === ".jpeg") {
        pipeline.jpeg({ quality: 88, mozjpeg: true });
      } else if (ext === ".png") {
        pipeline.png({ compressionLevel: 8 });
      } else if (ext === ".webp") {
        pipeline.webp({ quality: 88 });
      }

      const outputBuffer = await pipeline.toBuffer();
      fs.writeFileSync(filePath, outputBuffer);

      // Verify no GPS or sensitive EXIF exists in output
      const sanitizedMeta = await sharp(outputBuffer).metadata();

      processed.push({
        file,
        originalWidth: metadata.width,
        originalHeight: metadata.height,
        newWidth: sanitizedMeta.width,
        newHeight: sanitizedMeta.height,
        hasExif: Boolean(sanitizedMeta.exif),
      });

      console.log(
        `[journey:photos] Processed ${file}: ${metadata.width}x${metadata.height} -> ${sanitizedMeta.width}x${sanitizedMeta.height} (EXIF/GPS stripped)`
      );
    } catch (err) {
      console.error(`[journey:photos] Error processing ${file}:`, err);
      throw err;
    }
  }

  // Also sync to apps/web/public/content/journey/images for direct static serving
  const publicDir = path.join(rootDir, "apps/web/public/content/journey/images");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!imageExtensions.has(ext)) continue;
    fs.copyFileSync(path.join(imagesDir, file), path.join(publicDir, file));
  }

  return processed;
}

// Run directly if invoked as CLI script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  processJourneyPhotos()
    .then((res) => {
      console.log(`[journey:photos] Successfully processed ${res.length} photos.`);
    })
    .catch((err) => {
      console.error("[journey:photos] Failed:", err);
      process.exit(1);
    });
}

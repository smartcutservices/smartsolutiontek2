import { stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const mediaDir = path.resolve("apps/public-web/public/media/references");
const sources = [
  "school-enrollment-photos-v1.png",
  "school-enrollment-details-v1.png",
  "training-enrollment-photos-v1.png",
  "single-product-photos-v2.png",
  "single-product-photos-v1.png",
  "single-product-materials-v1.png",
  "multi-product-photos-v1.png",
  "multi-product-categories-v1.png",
  "multi-product-story-v1.png",
  "restaurant-reference-v1.png",
  "restaurant-photos-v1.png",
  "restaurant-menu-v1.png",
  "restaurant-hero-v1.png",
  "catering-reference-v1.png",
  "catering-photos-v1.png",
  "catering-studio-v1.png",
  "service-booking-reference-v1.png",
  "service-booking-photos-v1.png",
  "service-booking-details-v1.png",
  "beauty-reference-v1.png",
  "portfolio-reference-v1.png",
  "agency-reference-v1.png",
  "craftspeople-reference-v1.png",
  "events-reference-v1.png",
  "real-estate-reference-v1.png",
  "real-estate-hero-photo-v1.png",
  "hospitality-reference-v1.png",
  "hospitality-hero-photo-v1.png",
  "tourism-reference-v1.png",
  "tourism-hero-photo-v1.png",
  "vehicles-reference-v1.png",
  "vehicles-hero-photo-v1.png",
  "beauty-photos-v1.png",
  "beauty-gallery-v1.png",
];

for (const filename of sources) {
  const input = path.join(mediaDir, filename);
  const output = input.replace(/\.png$/i, ".webp");
  const original = await stat(input);
  const result = await sharp(input).webp({ quality: 82, effort: 6, smartSubsample: true }).toFile(output);
  const ratio = Math.round((1 - result.size / original.size) * 100);
  console.log(`${filename} → ${path.basename(output)}: ${original.size} → ${result.size} bytes (${ratio}% smaller)`);
}

import fs from "node:fs/promises";
import sharp from "sharp";

const reference = "apps/public-web/public/media/references/hospitality-reference-v1.png";
const heroSource = "apps/public-web/public/media/references/hospitality-hero-photo-v1.png";
const output = "apps/public-web/public/media/hospitality";
await fs.mkdir(output, { recursive: true });

const crops = {
  featured: [68, 466, 520, 234],
  room1: [60, 785, 260, 128],
  room2: [340, 785, 261, 128],
  room3: [620, 785, 261, 128],
  gallery1: [0, 1161, 191, 108],
  gallery2: [196, 1161, 187, 108],
  gallery3: [390, 1161, 177, 108],
  gallery4: [572, 1161, 177, 108],
  gallery5: [754, 1161, 187, 108],
  about: [69, 1286, 376, 182],
};

for (const [name, [left, top, width, height]] of Object.entries(crops)) {
  await sharp(reference)
    .extract({ left, top, width, height })
    .webp({ quality: 84, effort: 6 })
    .toFile(`${output}/${name}-v1.webp`);
}

await sharp(heroSource).webp({ quality: 84, effort: 6 }).toFile(`${output}/hero-v1.webp`);
await sharp(reference)
  .webp({ quality: 82, effort: 6, smartSubsample: true })
  .toFile("apps/public-web/public/media/references/hospitality-reference-v1.webp");

console.log(`${Object.keys(crops).length} hospitality crops, dedicated hero and reference WebP created`);

import fs from "node:fs/promises";
import sharp from "sharp";

const reference = "apps/public-web/public/media/references/vehicles-reference-v1.png";
const heroSource = "apps/public-web/public/media/references/vehicles-hero-photo-v1.png";
const output = "apps/public-web/public/media/vehicles";
await fs.mkdir(output, { recursive: true });

const crops = {
  story: [407, 475, 534, 291],
  vehicle1: [37, 869, 280, 150],
  vehicle2: [333, 869, 279, 150],
  vehicle3: [626, 869, 279, 150],
  banner: [0, 1209, 941, 128],
  advisor: [0, 1338, 319, 259],
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
  .toFile("apps/public-web/public/media/references/vehicles-reference-v1.webp");

console.log(`${Object.keys(crops).length} vehicle crops, hero and reference WebP created`);

import fs from "node:fs/promises";
import sharp from "sharp";
const reference = "apps/public-web/public/media/references/real-estate-reference-v1.png";
const heroSource = "apps/public-web/public/media/references/real-estate-hero-photo-v1.png";
const output = "apps/public-web/public/media/real-estate";
await fs.mkdir(output, { recursive: true });
const crops = {
  featured: [35, 435, 510, 257],
  listing1: [35, 750, 430, 156],
  listing2: [477, 750, 430, 156],
  listing3: [35, 950, 430, 156],
  listing4: [477, 950, 430, 156],
  about: [0, 1288, 464, 190],
  area: [0, 1480, 463, 132],
};
for (const [name, [left, top, width, height]] of Object.entries(crops)) {
  await sharp(reference).extract({ left, top, width, height }).webp({ quality: 84, effort: 6 }).toFile(`${output}/${name}-v1.webp`);
}
await sharp(heroSource).webp({ quality: 84, effort: 6 }).toFile(`${output}/hero-v1.webp`);
await sharp(reference).webp({ quality: 82, effort: 6, smartSubsample: true }).toFile("apps/public-web/public/media/references/real-estate-reference-v1.webp");
console.log(`${Object.keys(crops).length} real-estate crops, dedicated hero and reference WebP created`);

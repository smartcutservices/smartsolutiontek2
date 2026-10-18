import fs from "node:fs/promises";
import sharp from "sharp";
const source = "apps/public-web/public/media/references/ticketing-reference-v1.png";
const output = "apps/public-web/public/media/ticketing";
const heroSource = "apps/public-web/public/media/references/ticketing-hero-photo-v1.png";
await fs.mkdir(output, { recursive: true });
const crops = {
  music: [49, 602, 291, 165],
  art: [349, 602, 271, 165],
  community: [632, 602, 267, 165],
  artist1: [49, 926, 202, 177],
  artist2: [267, 926, 198, 177],
  artist3: [486, 926, 197, 177],
  artist4: [696, 926, 202, 177],
  footer: [295, 1380, 390, 292],
};
for (const [name, [left, top, width, height]] of Object.entries(crops)) {
  await sharp(source).extract({ left, top, width, height }).webp({ quality: 84, effort: 6 }).toFile(`${output}/${name}-v1.webp`);
}
await sharp(heroSource).webp({ quality: 84, effort: 6 }).toFile(`${output}/hero-v1.webp`);
await sharp(source).webp({ quality: 82, effort: 6, smartSubsample: true }).toFile("apps/public-web/public/media/references/ticketing-reference-v1.webp");
console.log(`${Object.keys(crops).length} ticketing crops and reference WebP created`);

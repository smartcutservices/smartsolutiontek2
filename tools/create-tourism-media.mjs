import fs from "node:fs/promises";
import sharp from "sharp";

const reference = "apps/public-web/public/media/references/tourism-reference-v1.png";
const heroSource = "apps/public-web/public/media/references/tourism-hero-photo-v1.png";
const output = "apps/public-web/public/media/tourism";
await fs.mkdir(output, { recursive: true });

const crops = {
  story: [452, 495, 489, 282],
  tour1: [39, 812, 279, 174],
  tour2: [333, 812, 276, 174],
  tour3: [624, 812, 278, 174],
  gallery1: [174, 1157, 223, 168],
  gallery2: [400, 1157, 103, 168],
  gallery3: [506, 1157, 222, 168],
  gallery4: [731, 1157, 210, 168],
  guides: [295, 1353, 350, 196],
};

for (const [name, [left, top, width, height]] of Object.entries(crops)) {
  await sharp(reference)
    .extract({ left, top, width, height })
    .webp({ quality: 84, effort: 6 })
    .toFile(`${output}/${name}-v1.webp`);
}

await sharp(heroSource)
  .webp({ quality: 84, effort: 6 })
  .toFile(`${output}/hero-v1.webp`);
await sharp(reference)
  .webp({ quality: 82, effort: 6, smartSubsample: true })
  .toFile("apps/public-web/public/media/references/tourism-reference-v1.webp");

console.log(`${Object.keys(crops).length} tourism crops, hero and reference WebP created`);

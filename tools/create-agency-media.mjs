import fs from "node:fs/promises";
import sharp from "sharp";
const source = "apps/public-web/public/media/references/agency-reference-v1.png";
const output = "apps/public-web/public/media/agency";
await fs.mkdir(output, { recursive: true });
const crops = { hero:[435,26,516,424], festival:[24,521,319,221], packaging:[355,520,276,222], portrait:[645,520,282,222], campaign:[0,1221,582,240] };
for (const [name, [left, top, width, height]] of Object.entries(crops)) await sharp(source).extract({left,top,width,height}).webp({quality:84,effort:6}).toFile(output+"/"+name+"-v1.webp");
await sharp(source).webp({quality:82,effort:6,smartSubsample:true}).toFile("apps/public-web/public/media/references/agency-reference-v1.webp");
console.log(Object.keys(crops).length+" crops and reference WebP generated");

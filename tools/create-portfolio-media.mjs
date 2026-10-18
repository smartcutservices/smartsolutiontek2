import fs from "node:fs/promises";
import sharp from "sharp";
const source = "apps/public-web/public/media/references/portfolio-reference-v1.png";
const output = "apps/public-web/public/media/portfolio";
await fs.mkdir(output, { recursive: true });
const crops = { hero:[326,0,515,370], vase:[22,386,320,218], food:[355,386,280,218], package:[643,386,292,218], architecture:[22,635,320,223], magazine:[355,635,310,223], textile:[679,635,255,223], portrait:[21,900,274,234], feature:[22,1232,478,182], featureDetail:[763,1232,172,182], contact:[0,1430,956,172] };
for (const [name, [left, top, width, height]] of Object.entries(crops)) { await sharp(source).extract({left,top,width,height}).webp({quality:84,effort:6}).toFile(output+"/"+name+"-v1.webp"); }
console.log(Object.keys(crops).length+" crops generated");

import fs from "node:fs/promises";
import sharp from "sharp";
const source = "apps/public-web/public/media/references/events-reference-v1.png";
const output = "apps/public-web/public/media/events";
await fs.mkdir(output, { recursive: true });
const crops = { hero:[446,60,505,394], music:[61,586,266,170], visual:[346,586,263,170], discussion:[629,586,266,170], about:[532,1046,419,173], contact:[0,1393,225,145] };
for (const [name,[left,top,width,height]] of Object.entries(crops)) await sharp(source).extract({left,top,width,height}).webp({quality:84,effort:6}).toFile(output+"/"+name+"-v1.webp");
await sharp(source).webp({quality:82,effort:6,smartSubsample:true}).toFile("apps/public-web/public/media/references/events-reference-v1.webp");
console.log(Object.keys(crops).length+" event photo crops and reference WebP created");

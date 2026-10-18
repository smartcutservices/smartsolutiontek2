import fs from "node:fs/promises";
import sharp from "sharp";
const source = "apps/public-web/public/media/references/craftspeople-reference-v1.png";
const output = "apps/public-web/public/media/craftspeople";
await fs.mkdir(output, { recursive: true });
const crops = { hero:[335,50,616,312], chair:[24,448,292,228], table:[330,448,291,228], cabinet:[637,448,292,228], listen:[91,810,82,65], draw:[322,810,70,65], build:[542,810,83,65], install:[790,810,90,65], artisan:[43,969,229,242], workshop:[275,969,244,242], interior:[0,1224,649,224], contact:[685,1450,266,140] };
for (const [name, [left, top, width, height]] of Object.entries(crops)) await sharp(source).extract({left,top,width,height}).webp({quality:84,effort:6}).toFile(output+"/"+name+"-v1.webp");
await sharp(source).webp({quality:82,effort:6,smartSubsample:true}).toFile("apps/public-web/public/media/references/craftspeople-reference-v1.webp");
console.log(Object.keys(crops).length+" artisan crops and reference WebP generated");

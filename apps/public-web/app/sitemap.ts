import type { MetadataRoute } from "next";
import { publishedDemos } from "./catalog";
import { getIndexablePublicOrigin } from "./seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getIndexablePublicOrigin();
  if (!origin) return [];

  return [
    { url: `${origin}/` },
    ...publishedDemos.map((entry) => ({
      url: `${origin}/demo/${entry.templateId}`,
      lastModified: new Date(entry.publishedAt),
    })),
  ];
}

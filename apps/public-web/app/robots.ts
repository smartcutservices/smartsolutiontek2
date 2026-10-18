import type { MetadataRoute } from "next";
import { getIndexablePublicOrigin } from "./seo";

export default function robots(): MetadataRoute.Robots {
  const origin = getIndexablePublicOrigin();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    ...(origin ? {
      host: origin,
      sitemap: `${origin}/sitemap.xml`,
    } : {}),
  };
}

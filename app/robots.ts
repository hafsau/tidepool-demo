import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // Crawlers may fetch pages so they can read the noindex tag on each one.
  return { rules: { userAgent: "*", allow: "/" } };
}

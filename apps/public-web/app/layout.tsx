import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./education-enrollment.css";
import "./service-booking.css";
import "./beauty.css";
import "./portfolio.css";
import "./agency.css";
import "./craftspeople.css";
import "./events.css";
import "./real-estate.css";
import "./hospitality.css";
import "./tourism.css";
import "./vehicles.css";
import "./ticketing.css";
import { getIndexablePublicOrigin } from "./seo";
const publicOrigin = getIndexablePublicOrigin();
const siteTitle = "Smart Solutions Tech";
const siteDescription = "Faites défiler les références visuelles des modèles et choisissez celle à personnaliser.";

export const metadata: Metadata = {
  title: siteTitle,
  description: siteDescription,
  robots: { index: Boolean(publicOrigin), follow: Boolean(publicOrigin) },
  ...(publicOrigin ? {
    metadataBase: new URL(publicOrigin),
    alternates: { canonical: "/" },
    openGraph: { type: "website" as const, title: siteTitle, description: siteDescription, url: publicOrigin },
  } : {}),
};
export const viewport: Viewport = { themeColor: "#090a0d", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}



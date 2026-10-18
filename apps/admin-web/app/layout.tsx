import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Solutions Tech | Administration",
  description: "Espace d’administration Smart Solutions Tech"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
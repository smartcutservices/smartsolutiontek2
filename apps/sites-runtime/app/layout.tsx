import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Site en préparation | Smart Solutions Tech",
  description: "Runtime de sites Smart Solutions Tech"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
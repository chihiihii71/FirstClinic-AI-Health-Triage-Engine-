import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BourneIt",
  description: "Health Triage Engine",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Asiavision 2026",
  description: "Friends-only voting for Asiavision 2026",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-asia-bg text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}

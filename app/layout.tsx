import type { Metadata } from "next";
import "./globals.css";
import RootShell from "./components/RootShell";

export const metadata: Metadata = {
  title: "Hotel CRM",
  description: "Goldient Boutique Hotel CRM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <RootShell>{children}</RootShell>
      </body>
    </html>
  );
}
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Partai Wilhelmus",
  description: "Manajemen tugas harian keluarga Wilhelmus",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}

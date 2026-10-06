import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quiz PDF",
  description: "Cartes de révision générées à partir de vos PDF",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}

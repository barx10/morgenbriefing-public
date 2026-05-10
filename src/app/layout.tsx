import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SessionWrapper from "@/components/SessionWrapper";
import "./globals.css";

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Morgenbriefing",
  description: "Din daglige morgenoppdatering",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="nb">
      <body
        className={`${displayFont.variable} ${bodyFont.variable} min-h-screen bg-[var(--background)] font-[family:var(--font-body)] text-[var(--foreground)] antialiased`}
      >
        <SessionWrapper session={session}>{children}</SessionWrapper>
      </body>
    </html>
  );
}

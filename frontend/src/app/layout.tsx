import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import { FlashBanner } from "@/components/FlashBanner";
import { Nav } from "@/components/Nav";
import { SessionGuard } from "@/components/SessionGuard";
import { SessionProvider } from "@/components/SessionProvider";
import "./globals.css";

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Community Events",
  description: "Suggest, upvote, and approve community events",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${body.variable} ${display.variable} min-h-screen antialiased`}>
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-24 top-[-10%] h-112 w-md rounded-full bg-[radial-gradient(circle,rgba(42,92,74,0.16),transparent_68%)]" />
          <div className="absolute right-[-8%] top-[20%] h-88 w-88 rounded-full bg-[radial-gradient(circle,rgba(224,122,95,0.16),transparent_70%)]" />
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='%230d1f1a' stroke-width='1'%3E%3Cpath d='M0 40h80M40 0v80'/%3E%3C/g%3E%3C/svg%3E\")",
            }}
          />
        </div>
        <SessionProvider>
          <SessionGuard />
          <FlashBanner />
          <Nav />
          <main>{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Color Shift",
  description: "Color Shift - Interactive color palette generator",
  metadataBase: new URL("https://colorshift.co-opstudio.com"),
  openGraph: {
    title: "Color Shift",
    description: "Color Shift - Interactive color palette generator",
    url: "https://colorshift.co-opstudio.com",
    siteName: "Color Shift",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Color Shift",
    description: "Color Shift - Interactive color palette generator",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Agentation } from "agentation";

import { MotionDevtools } from "@/components/motion-devtools";
import { TooltipProvider } from "@/components/ui/tooltip";
import { THEME_BOOTSTRAP } from "@/lib/theme";

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
  description: "Photo-driven color pairs with guaranteed readable contrast.",
  metadataBase: new URL("https://colorshift.co-opstudio.com"),
  openGraph: {
    title: "Color Shift",
    description: "Photo-driven color pairs with guaranteed readable contrast.",
    url: "https://colorshift.co-opstudio.com",
    siteName: "Color Shift",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Color Shift",
    description: "Photo-driven color pairs with guaranteed readable contrast.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full`}
      data-theme="dark"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="flex min-h-full flex-col antialiased">
        <TooltipProvider>{children}</TooltipProvider>
        {process.env.NODE_ENV === "development" && (
          <>
            <MotionDevtools />
            <Agentation appName="Color Shift" enableKeyboardShortcuts={false} />
          </>
        )}
      </body>
    </html>
  );
}

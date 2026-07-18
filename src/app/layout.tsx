import type { Metadata } from "next";
import localFont from "next/font/local";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import MotionProvider from "@/components/MotionProvider";
import ThemeToggle from "@/components/ThemeToggle";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Website Audit Tool | AI-Powered Page Analysis",
  description:
    "Analyze any webpage for SEO, content clarity, UX, and conversion optimization with AI-powered insights grounded in real metrics.",
};

// Runs before paint: dark is the SSR default, remove it only for stored light users
const themeScript = `(function(){try{if(localStorage.getItem("audit-theme")==="light")document.documentElement.classList.remove("dark")}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased`}
      >
        <MotionProvider>
          <header className="glass sticky top-0 z-50 border-x-0 border-t-0">
            <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
              <span className="font-display text-base font-bold tracking-tight">
                Audit
                <span className="bg-accent-gradient bg-clip-text text-transparent">
                  .
                </span>
              </span>
              <ThemeToggle />
            </div>
          </header>
          {children}
        </MotionProvider>
      </body>
    </html>
  );
}

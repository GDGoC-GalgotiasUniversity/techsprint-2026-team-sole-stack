import { Viewport } from "next";
import "./globals.css";
import { Montserrat } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Clarity from "@/components/Clarity";

const mont = Montserrat({ subsets: ["latin"] });

export const metadata = {
  title: "Gemini Novel",
  description:
    "Gemini Novel - Made using Next.js 15 and Vercel AI sdk powered by Google Gemini. Supports multiple Gemini models including Gemini 2.0 Flash and Gemini 1.5",
  metadataBase: new URL("https://gemini-ai.vercel.app/"),
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon-32x32.png",
    apple: "/apple-touch-icon.png",
  },
};
export const viewport: Viewport = {
  themeColor: "#d03e09",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {process.env.NODE_ENV === "production" ? <Clarity /> : null}
      <body className={mont.className + " overflow-hidden"} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
          <div className="relative h-full w-full bg-mesh text-zinc-100 overflow-hidden supports-[height:100cqh]:h-[100cqh] supports-[height:100svh]:h-[100svh]">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

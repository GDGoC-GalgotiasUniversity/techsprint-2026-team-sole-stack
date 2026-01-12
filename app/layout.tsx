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
    <html lang="en">
      {process.env.NODE_ENV === "production" ? <Clarity /> : null}
      <body className={mont.className + " overflow-hidden"}>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <div className="relative h-full w-full bg-stone-100 dark:bg-stone-900 overflow-hidden">
            <div className="absolute bottom-0 left-[-20%] right-0 top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(255,105,12,.15),rgba(255,255,255,0))] opacity-0 md:opacity-100 pointer-events-none select-none"></div>
            <div className="absolute bottom-0 right-[-20%] top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(255,105,12,.15),rgba(255,255,255,0))] pointer-events-none select-none"></div>
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

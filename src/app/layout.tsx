import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AppRegistration } from "@/components/app-registration";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import "./workspace-refine.css";
import { FeedbackProvider } from "@/components/feedback-provider";
const inter = localFont({
  src: "./fonts/Inter.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});
const cairo = localFont({
  src: "./fonts/Cairo.woff2",
  variable: "--font-cairo",
  weight: "200 1000",
  display: "swap",
});
export const metadata: Metadata = {
  title: {
    default: "ArzDesk — Your work, in one place",
    template: "%s · ArzDesk",
  },
  description: "A workspace for clients, projects and the people behind them.",
  robots: { index: false, follow: false },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "ArzDesk", statusBarStyle: "default" },
  icons: {
    icon: {
      url: "/arzdesk-logo-v1.png",
      type: "image/png",
      sizes: "1254x1254",
    },
    apple: "/arzdesk-logo-v1.png",
  },
};
export const viewport: Viewport = { themeColor: "#5145d9" };
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${cairo.variable}`}
      suppressHydrationWarning
    >
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var d='light';try{if(localStorage.getItem('arzdesk-theme')==='dark')d='dark';}catch(e){}document.documentElement.dataset.theme=d;})();`,
          }}
        />
        <ThemeProvider>
          <FeedbackProvider>
            <AppRegistration />
            {children}
          </FeedbackProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

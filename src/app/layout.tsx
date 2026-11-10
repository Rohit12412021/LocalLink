import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import AppProviders from "@/components/providers/app-providers";
import { ErrorBoundary } from "@/components/error-boundary";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const FOUC_SCRIPT = `(function(){try{var t=localStorage.getItem("locallink_theme");var d=t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;

export const metadata: Metadata = {
  title: "LocalLink - Find Trusted Local Services",
  description:
    "Connect with verified local service providers including mechanics, plumbers, electricians, and more. Get instant quotes, book appointments, and track your service requests in real-time.",
  keywords:
    "local services, mechanics, plumbers, electricians, home services, service booking, verified providers",
  authors: [{ name: "LocalLink" }],
  creator: "LocalLink",
  publisher: "LocalLink",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "LocalLink - Find Trusted Local Services",
    description:
      "Connect with verified local service providers including mechanics, plumbers, electricians, and more.",
    url: "/",
    siteName: "LocalLink",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LocalLink - Find Trusted Local Services",
    description: "Connect with verified local service providers",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={plusJakartaSans.variable}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: FOUC_SCRIPT }} />
      </head>
      <body className="font-sans antialiased">
        <AppProviders>
          <ErrorBoundary>{children}</ErrorBoundary>
        </AppProviders>
      </body>
    </html>
  );
}
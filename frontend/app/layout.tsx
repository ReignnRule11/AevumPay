import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AevumPay — Stablecoin Invoice Settlement",
  description: "Create and settle tUSD8 invoices on QDay Aevum Testnet.",
  applicationName: "AevumPay",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "AevumPay",
    statusBarStyle: "black-translucent"
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }]
  }
};

export const viewport: Viewport = {
  themeColor: "#0a1113",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <script src="/service-worker-register.js" defer />
      </body>
    </html>
  );
}

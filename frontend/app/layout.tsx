import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AevumPay — Stablecoin Invoice Settlement",
  description: "Create and settle tUSD8 invoices on QDay Aevum Testnet."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

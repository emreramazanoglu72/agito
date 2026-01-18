import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "primeicons/primeicons.css"; // Icons
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";

import ReactQueryProvider from "../providers/react-query";
import { Toaster } from "../components/ui/toaster";
import { Topbar } from "../components/organisms/Topbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Agito | Corporate Policy Portal",
  description: "B2B Insurance Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
        <ReactQueryProvider>
          <Theme accentColor="jade" radius="large" appearance="light">
            {children}
          </Theme>
          <Toaster />
        </ReactQueryProvider>
      </body>
    </html>
  );
}

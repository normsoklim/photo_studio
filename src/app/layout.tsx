import type { Metadata } from "next";
import { Nunito } from "next/font/google";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: {
    default: "Cutie Studio | Your Little Photo World",
    template: "%s | Cutie Studio",
  },
  description:
    "Create adorable photos with cute filters, stickers, frames and creative editing tools.",
  applicationName: "Cutie Studio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={nunito.variable}>
        <Navbar />

        {children}

        <Footer />
      </body>
    </html>
  );
}

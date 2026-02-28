import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "@/components/ui/Toast";
import { FirestoreErrorHandler } from "@/components/shared/FirestoreErrorHandler";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Booking Platform",
  description: "Multi-tenant booking platform for salons and service businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${inter.variable} font-sans antialiased`}>
        <FirestoreErrorHandler />
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}

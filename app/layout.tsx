import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NotificationProvider } from "../contexts/NotificationContext";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Ludo Game - OTP Authentication",
  description: "Secure Ludo game with OTP-based authentication system",
  other: {
    "fast2sms": "Qb7wtVce2ueEp0keJ3GkKOU7vGFFSE4j",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <NotificationProvider>
          {children}
          <Toaster />
        </NotificationProvider>
      </body>
    </html>
  );
}

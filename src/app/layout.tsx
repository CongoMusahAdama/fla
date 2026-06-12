import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import ChatSupport from "@/components/ChatSupport";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "FLA Purchase | Exclusive Designs & Quality Brands",
  description: "Your Style, Curated and Delivered.",
  icons: {
    icon: [
      { url: '/logo.jpeg' },
      { url: '/logo.jpeg', sizes: '32x32', type: 'image/jpeg' },
    ],
    shortcut: '/logo.jpeg',
    apple: '/logo.jpeg',
  },
};

import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plusJakarta.variable} antialiased bg-white text-slate-800 font-sans`}
      >
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <CartDrawer />
            {children}
            <ChatSupport />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

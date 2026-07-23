import type { Metadata } from "next";
import "./globals.css";
import ChatSupport from "@/components/ChatSupport";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { Suspense } from "react";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-white text-slate-800 font-sans">
        <AuthProvider>
          <CartProvider>
            <Suspense fallback={<div className="h-[72px] bg-white border-b border-slate-100" />}>
              <Navbar />
            </Suspense>
            <CartDrawer />
            {children}
            <ChatSupport />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

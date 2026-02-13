import type { Metadata } from "next";
import { Montserrat, Outfit } from "next/font/google";
import "./globals.css";
import ChatSupport from "@/components/ChatSupport";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Unity Purchase | Custom-Print & Bespoke Tailoring",
  description: "Your Style, Tailored in Real-Time.",
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
        className={`${montserrat.variable} ${outfit.variable} antialiased bg-white text-slate-800 font-sans`}
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

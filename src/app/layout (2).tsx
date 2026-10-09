import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { Navbar } from "@/components/Navbar";

// Lighter weights (300/400) added for the thin, premium headline look; the
// heavier ones stay so every other page keeps rendering as before.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["300", "400", "500", "600", "700", "800"],
});
const body = Inter({ subsets: ["latin"], variable: "--font-body", weight: ["300", "400", "500", "600", "700"] });
// Italic serif used sparingly for accent words in headings (.font-serif-accent).
const serif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "KulaGo — Kenyan food, delivered fast",
  description: "Order home-cooked Kenyan food and beverages, with free delivery in select zones. Track your order from the kitchen to your door.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${serif.variable}`}>
      <body className="font-body min-h-screen flex flex-col">
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

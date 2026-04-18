import { Outfit, Syne } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Providers } from "@/components/Providers";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "SWAAP — Create. Connect. Collaborate.",
  description:
    "Professional networking and meetups. Create value, connect with the right people, collaborate at SWAAP events.",
  icons: {
    icon: "/Logo/logo_blue.png",
    apple: "/Logo/logo_blue.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${syne.variable} antialiased font-sans`}>
        <Providers>
          <Header />
          <main className="min-h-[calc(100vh-8rem)]">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

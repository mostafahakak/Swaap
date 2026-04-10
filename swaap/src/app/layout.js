import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Providers } from "@/components/Providers";
// FirebaseAnalytics disabled until firebase is installed. Run: npm install. Then add: import { FirebaseAnalytics } from "@/components/FirebaseAnalytics"; and <FirebaseAnalytics /> after <Header />.

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata = {
  title: "SWAAP — Connect. Collaborate. Create Value.",
  description:
    "Professional networking and AI matchmaking. Swap expertise, discover events, and connect with like-minded professionals.",
  icons: {
    icon: "/Logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} antialiased font-sans`}>
        <Providers>
          <Header />
          <main className="min-h-[calc(100vh-8rem)]">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

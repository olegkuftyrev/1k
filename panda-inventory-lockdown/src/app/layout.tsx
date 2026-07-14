import type { Metadata } from "next";
import { Noto_Sans, Noto_Sans_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { getAllStores, getManagers } from "@/lib/stores";

const notoSans = Noto_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const notoMono = Noto_Sans_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Panda Lockdown — Inventory Ordering",
  description:
    "Inventory lockdown ordering dashboard for Panda Express store managers.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const stores = await getAllStores();
  const managers = await getManagers();
  const headerStores = stores.map((s) => ({
    number: s.store.number,
    manager: managers[s.store.number],
  }));

  return (
    <html
      lang="en"
      className={`${notoSans.variable} ${notoMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background">
        <SiteHeader stores={headerStores} />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}

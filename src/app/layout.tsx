import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import SessionProvider from "@/components/SessionProvider";

export const metadata: Metadata = {
  title: "주식류 - 종합 주식 투자 플랫폼",
  description: "실시간 시장 정보, 기업 분석, 수익률 계산, 투자 가이드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="bg-[#0f172a]">
      <body className="bg-[#0f172a] text-slate-100 antialiased">
        <SessionProvider>
          <CurrencyProvider>
            <Navbar />
            <main className="min-h-screen pb-20">{children}</main>
          </CurrencyProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

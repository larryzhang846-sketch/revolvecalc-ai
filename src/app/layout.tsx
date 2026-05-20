import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Noto_Sans_SC } from "next/font/google";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const chinese = Noto_Sans_SC({
  subsets: ["latin"],
  variable: "--font-chinese",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RevolveCalc AI — 旋转体体积计算器",
  description:
    "AP 微积分 BC 旋转体体积计算器，支持垫圈法、柱壳法、分步解答与三维可视化。",
  openGraph: {
    title: "RevolveCalc AI",
    description: "AI 驱动的 AP 微积分 BC 旋转体学习工具",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#07070f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${sans.variable} ${chinese.variable} ${mono.variable}`}>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}

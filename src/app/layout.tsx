import type { Metadata } from "next";
import { Open_Sans, Poppins, Noto_Sans_SC } from "next/font/google";
import Link from "next/link";
import UUIDCompat from "@/components/UUIDCompat";
import Gatekeeper from "@/components/Gatekeeper";
import MobileNav from "@/components/MobileNav";
import "./globals.css";

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
  adjustFontFallback: true,
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  adjustFontFallback: true,
});

const notoSansSC = Noto_Sans_SC({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-noto-sans-sc",
  display: "swap",
  adjustFontFallback: true,
});

const SITE_URL = process.env.SITE_URL || "https://yanchuaner.cn";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "\u71d5\u4e2d\u6821\u53cb\u6570\u5b57\u6bcd\u6e2f",
    template: "%s | \u71d5\u4e2d\u6821\u53cb\u6570\u5b57\u6bcd\u6e2f",
  },
  description:
    "\u6df1\u5733\u5e02\u71d5\u5ddd\u4e2d\u5b66\u6821\u53cb\u4f1a\u5b98\u7f51 \u2014 \u8fde\u63a5\u6bd5\u4e1a\u6821\u53cb\u3001\u5728\u6821\u5b66\u751f\u4e0e\u8001\u5e08\u7684\u516c\u76ca\u6570\u5b57\u5e73\u53f0\u3002\u63d0\u4f9b\u6821\u53cb\u901a\u8baf\u5f55\u3001\u6821\u56ed\u8bb0\u5fc6\u3001\u6821\u53cb\u6545\u4e8b\u3001\u6d3b\u52a8\u516c\u544a\u7b49\u670d\u52a1\u3002",
  keywords: [
    "\u71d5\u5ddd\u4e2d\u5b66",
    "\u6821\u53cb\u4f1a",
    "\u6821\u53cb\u7f51",
    "\u6df1\u5733\u6821\u53cb",
    "\u71d5\u4e2d\u6821\u53cb",
    "\u6bd5\u4e1a\u6821\u53cb",
    "\u6821\u53cb\u901a\u8baf\u5f55",
  ],
  authors: [{ name: "\u71d5\u4e2d\u6821\u53cb\u6570\u5b57\u6bcd\u6e2f" }],
  creator: "\u71d5\u4e2d\u6821\u53cb\u6570\u5b57\u6bcd\u6e2f",
  publisher: "\u71d5\u4e2d\u6821\u53cb\u6570\u5b57\u6bcd\u6e2f",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: SITE_URL,
    siteName: "\u71d5\u4e2d\u6821\u53cb\u6570\u5b57\u6bcd\u6e2f",
    title: "\u71d5\u4e2d\u6821\u53cb\u6570\u5b57\u6bcd\u6e2f",
    description:
      "\u6df1\u5733\u5e02\u71d5\u5ddd\u4e2d\u5b66\u6821\u53cb\u4f1a\u5b98\u7f51 \u2014 \u8fde\u63a5\u6bd5\u4e1a\u6821\u53cb\u3001\u5728\u6821\u5b66\u751f\u4e0e\u8001\u5e08\u7684\u516c\u76ca\u6570\u5b57\u5e73\u53f0",
    images: [
      {
        url: `${SITE_URL}/card-bg.jpg`,
        width: 2752,
        height: 1536,
        alt: "\u71d5\u4e2d\u6821\u53cb\u6570\u5b57\u6bcd\u6e2f",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "\u71d5\u4e2d\u6821\u53cb\u6570\u5b57\u6bcd\u6e2f",
    description: "\u6df1\u5733\u5e02\u71d5\u5ddd\u4e2d\u5b66\u6821\u53cb\u4f1a\u5b98\u7f51 \u2014 \u8fde\u63a5\u6bd5\u4e1a\u6821\u53cb\u3001\u5728\u6821\u5b66\u751f\u4e0e\u8001\u5e08\u7684\u516c\u76ca\u6570\u5b57\u5e73\u53f0",
    images: [`${SITE_URL}/card-bg.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${openSans.variable} ${poppins.variable} ${notoSansSC.variable}`}>
      <body className="font-sans antialiased text-[#4C1D95] bg-[#FAF5FF]">
        <Gatekeeper initialIsVerified={false}>
          <UUIDCompat />
          <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#FAF5FF] to-[#F3E8FF]">
            {/* 导航栏 */}
            <header className="glass sticky top-0 z-50 border-b border-[#7C3AED]/10 transition-colors duration-300 hover:border-[#7C3AED]/20">
              <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
                <Link
                  href="/"
                  aria-label="返回首页：燕中数字母港"
                  tabIndex={0}
                  className="group relative text-lg font-bold tracking-wide text-[#7C3AED] transition-colors duration-300 hover:text-[#5B21B6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF5FF] rounded-sm cursor-pointer font-heading"
                >
                  {"\u71d5\u4e2d\u6570\u5b57\u6bcd\u6e2f"}
                  <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-[#7C3AED] shadow-[0_0_8px_rgba(124,58,237,0.5)] transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <MobileNav />
              </div>
            </header>

            <main className="relative z-10">{children}</main>

            {/* 页脚 */}
            <footer className="glass relative z-10 border-t border-[#7C3AED]/10">
              <div className="mx-auto max-w-6xl px-4 py-5 md:px-8">
                <div className="flex flex-col items-center justify-between gap-2 text-sm text-[#7C3AED]/70 md:flex-row">
                  <p>
                    \u00a9 2025-2026 \u71d5\u4e2d\u6821\u53cb\u6570\u5b57\u6bcd\u6e2f\uff08\u4e2a\u4eba\u516c\u76ca\u7248\uff09
                  </p>
                  <p>{"\u58f0\u660e\uff1a\u4e2a\u4eba\u516c\u76ca\u3001\u975e\u5b98\u65b9\u3001\u65e0\u76c8\u5229"}</p>
                </div>
                <div className="mt-2 flex justify-center">
                  <a
                    href="https://beian.miit.gov.cn/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="访问工信部备案系统"
                    tabIndex={0}
                    className="text-xs text-[#7C3AED]/40 transition hover:text-[#7C3AED]/60 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:ring-offset-2 focus:ring-offset-[#FAF5FF] cursor-pointer transition-all duration-300"
                  >
                    {"\u7ca4ICP\u59072026024784\u53f7-2"}
                  </a>
                </div>
              </div>
            </footer>
          </div>
        </Gatekeeper>
      </body>
    </html>
  );
}

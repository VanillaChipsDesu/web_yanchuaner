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
    default: "燕中校友数字母港",
    template: "%s | 燕中校友数字母港",
  },
  description:
    "深圳市燕川中学校友会官网 — 连接毕业校友、在校学生与老师的公益数字平台。提供校友通讯录、校园记忆、校友故事、活动公告等服务。",
  keywords: [
    "燕川中学",
    "校友会",
    "校友网",
    "深圳校友",
    "燕中校友",
    "毕业校友",
    "校友通讯录",
  ],
  authors: [{ name: "燕中校友数字母港" }],
  creator: "燕中校友数字母港",
  publisher: "燕中校友数字母港",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: SITE_URL,
    siteName: "燕中校友数字母港",
    title: "燕中校友数字母港",
    description:
      "深圳市燕川中学校友会官网 — 连接毕业校友、在校学生与老师的公益数字平台",
    images: [
      {
        url: `${SITE_URL}/card.jpg`,
        width: 2752,
        height: 1548,
        alt: "燕中校友数字母港",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "燕中校友数字母港",
    description: "深圳市燕川中学校友会官网 — 连接毕业校友、在校学生与老师的公益数字平台",
    images: [`${SITE_URL}/card.jpg`],
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
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[#7C3AED] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:ring-offset-2 focus:ring-offset-[#FAF5FF]"
        >
          跳到正文
        </a>
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
                  {"燕中数字母港"}
                  <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-[#7C3AED] shadow-[0_0_8px_rgba(124,58,237,0.5)] transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <MobileNav />
              </div>
            </header>

            <main id="main" className="relative z-20">{children}</main>

            {/* 页脚 */}
            <footer className="glass relative z-10 border-t border-[#7C3AED]/10">
              <div className="mx-auto max-w-6xl px-4 py-5 md:px-8">
                <div className="flex flex-col items-center justify-between gap-2 text-sm text-[#7C3AED]/70 md:flex-row">
                  <p>
                    © 2025-2026 燕中校友数字母港（个人公益版）
                  </p>
                  <p>{"声明：个人公益、非官方、无盈利"}</p>
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
                    {"粤ICP备2026024784号-2"}
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

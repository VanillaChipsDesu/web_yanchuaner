import type { Metadata } from "next";
import { Toaster } from "sonner";
import UUIDCompat from "@/components/UUIDCompat";
import AuthProvider from "@/components/AuthProvider";
import { InteractiveStarfield } from "@/components/ui";
import "./globals.css";

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
    <html lang="zh-CN">
      <body className="font-sans antialiased text-[var(--color-text)] bg-[var(--color-background)]">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[#7C3AED] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:ring-offset-2 focus:ring-offset-[#FAF5FF]"
        >
          跳到正文
        </a>
        <AuthProvider>
            <UUIDCompat />
            <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#FAF5FF] to-[#F3E8FF]">
              {/* 全局宇宙氛围背景（使所有子页面的磨砂玻璃卡片背后折射出流星与星空） */}
              <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-60" aria-hidden="true">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_15%,rgba(124,58,237,0.06),transparent_40%),radial-gradient(circle_at_85%_80%,rgba(167,139,250,0.08),transparent_40%)]" />
                <InteractiveStarfield />
                <div className="meteor-layer absolute inset-0 opacity-[0.10]" />
              </div>
              
              {children}
          </div>
          {/* 星空紫主题 Toast 通知 */}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "rgba(15, 10, 29, 0.85)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(168, 85, 247, 0.30)",
                color: "#e9d5ff",
                borderRadius: "12px",
                boxShadow: "0 8px 32px rgba(124, 58, 237, 0.20), 0 0 0 1px rgba(168,85,247,0.10)",
                fontSize: "14px",
              },
              classNames: {
                title: "text-purple-100 font-semibold",
                description: "text-purple-300/80 text-xs mt-0.5",
                actionButton: "bg-purple-600 text-white hover:bg-purple-500",
                cancelButton: "bg-purple-900/50 text-purple-200",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}

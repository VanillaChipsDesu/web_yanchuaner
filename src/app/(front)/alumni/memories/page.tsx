import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Camera, House, Landmark, LibraryBig, Mountain, Trees } from "lucide-react";
import prisma from "@/lib/db";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "燕中记忆",
  description: "燕川中学校园风景、毕业合影与时代记录 — 燕中校友数字母港文化记忆展区",
};

type MemoryIcon = "house" | "landmark" | "library" | "mountain" | "trees" | "camera";

type MemoryItem = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imagePath: string;
  imageAlt: string;
  icon: MemoryIcon;
  hasImage: boolean;
};

function pickIcon(iconName: MemoryIcon) {
  if (iconName === "house") return House;
  if (iconName === "landmark") return Landmark;
  if (iconName === "library") return LibraryBig;
  if (iconName === "mountain") return Mountain;
  if (iconName === "trees") return Trees;
  return Camera;
}

async function getMemories(): Promise<MemoryItem[]> {
  try {
    const items = await prisma.memoryItem.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return items.map((item) => {
      let hasImage = false;
      if (item.imagePath && item.imagePath.startsWith('/')) {
        const absPath = path.join(process.cwd(), 'public', item.imagePath.replace(/^\/+/, ''));
        hasImage = fs.existsSync(absPath);
      }
      return { ...item, hasImage, icon: item.icon as MemoryIcon };
    });
  } catch {
    return [];
  }
}

export default async function AlumniMemoriesPage() {
  const memoryItems = await getMemories();

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-12">
      <div className="glass-card-base p-5 md:p-8">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-3 py-1 text-xs tracking-[0.18em] text-[#7C3AED]">
              <Camera size={14} />
              MEMORY GALLERY
            </p>
            <h1 className="font-heading mt-3 text-3xl font-bold text-[#4C1D95] md:text-4xl">{"燕中记忆 · 文化长廊"}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-700 md:text-base">
              {"校园风景、毕业合照（打码版）与年代记录，由管理员维护更新。"}
            </p>
          </div>

          <Link href="/" className="btn-secondary">
            {"返回指挥中心"}
          </Link>
        </header>

        {memoryItems.length === 0 ? (
          <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-16 text-gray-400">
            <Camera size={48} className="mb-3 opacity-40" />
            <p className="text-sm">暂无记忆展品，管理员正在整理中...</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {memoryItems.map((item) => {
              const Icon = pickIcon(item.icon as MemoryIcon);
              return (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="relative aspect-video overflow-hidden border-b border-gray-100 bg-[#F3E8FF]/30">
                    {item.hasImage ? (
                      <Image
                        src={item.imagePath}
                        alt={item.imageAlt || item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
                      />
                    ) : null}

                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-80" />

                    {!item.hasImage ? (
                      <div className="absolute inset-0 flex items-center justify-center px-3 text-center text-xs font-semibold tracking-[0.16em] text-[#7C3AED]/70">
                        {"IMAGE PENDING"}
                      </div>
                    ) : null}

                    <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-white/90 px-2.5 py-1 text-xs text-[#7C3AED] shadow-sm backdrop-blur-sm">
                      <Icon size={13} />
                      {item.subtitle}
                    </div>

                    {!item.hasImage && (
                      <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-white/90 px-3 py-2 text-[11px] text-gray-500 shadow-sm backdrop-blur-sm">
                        暂无图片，等待管理员上传
                      </div>
                    )}
                  </div>

                  <div className="p-4 md:p-5">
                    <h2 className="font-heading text-lg font-semibold text-[#4C1D95]">{item.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{item.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-800">
          {"合规提示：本展区仅用于文化记忆展示，不承载任何官方认证、人身证明或商业用途。"}
        </div>
      </div>
    </section>
  );
}

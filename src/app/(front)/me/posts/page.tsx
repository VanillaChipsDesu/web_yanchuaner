"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function MyPostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/me/posts").then((res) => res.json()).then((data) => setPosts(data.posts || []));
  }, []);
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/me" className="mb-4 inline-flex text-sm text-brand hover:underline">
        ← 返回个人中心
      </Link>
      <h1 className="text-2xl font-bold">我的投稿</h1>
      <div className="mt-6 space-y-3">
        {posts.length ? posts.map((post) => (
          <article key={post.id} className="rounded-card border border-line bg-surface/50 backdrop-blur-md p-5">
            <h2 className="font-semibold">{post.title}</h2>
            <p className="mt-1 text-sm text-brand-fg/60">{post.type} · {post.status}</p>
          </article>
        )) : <p className="text-brand-fg/60">暂无投稿。</p>}
      </div>
    </section>
  );
}

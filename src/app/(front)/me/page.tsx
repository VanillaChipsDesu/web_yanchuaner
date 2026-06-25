import Link from "next/link";
import { requirePageUser } from "@/lib/admin-auth";

export default async function MePage() {
  const user = await requirePageUser();
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-card border border-line bg-surface/50 backdrop-blur-xl p-7">
        <h1 className="text-2xl font-bold">个人中心</h1>
        <p className="mt-2 text-brand-fg/70">
          {user.name || user.username} · {user.email}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Link className="rounded-xl border border-brand/15 p-4 hover:bg-brand/5" href="/me/edit">编辑资料</Link>
          <Link className="rounded-xl border border-brand/15 p-4 hover:bg-brand/5" href="/me/posts">我的投稿</Link>
          <Link className="rounded-xl border border-brand/15 p-4 hover:bg-brand/5" href="/me/change-password">修改密码</Link>
        </div>
        <p className="mt-6 text-sm text-brand-fg/60">
          校友认证状态：{user.status}
        </p>
      </div>
    </section>
  );
}

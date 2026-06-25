"use client";

import { useEffect, useState } from "react";

export default function UserClaimsPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function load() {
    const response = await fetch("/api/admin/user-claims");
    const data = await response.json();
    setClaims(data.claims || []);
    setCandidates(data.candidates || []);
  }
  useEffect(() => { void load(); }, []);

  async function act(id: string, action: "approve-claim" | "reject-claim") {
    const candidate = candidates.find((item) => item.id === selected[id]);
    if (
      action === "approve-claim" &&
      !window.confirm(`确认转移该旧资料关联的 ${candidate?._count?.posts || 0} 篇投稿？`)
    ) return;
    const response = await fetch(`/api/admin/user-claims/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        oldUserId: selected[id],
        adminNote: notes[id] || "",
      }),
    });
    if (!response.ok) {
      const data = await response.json();
      alert(data.error || "操作失败");
      return;
    }
    await load();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">旧资料认领审核</h2>
      <div className="mt-6 space-y-4">
        {claims.map((claim) => (
          <section key={claim.id} className="rounded-2xl border border-brand/15 bg-white/70 p-5">
            <h3 className="font-semibold">{claim.claimant.name}（{claim.claimant.username}）</h3>
            <p className="mt-1 text-sm text-brand-fg/60">{claim.claimant.email} · {claim.claimant.graduationClass || "届别未填"} · {claim.claimant.contact || "无联系方式"}</p>
            <select className="input mt-4 w-full" value={selected[claim.id] || ""} onChange={(e) => setSelected((old) => ({ ...old, [claim.id]: e.target.value }))}>
              <option value="">选择可认领的旧资料</option>
              {candidates.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name || "未命名"} · {item.contact || "无联系方式"} · {item.identityCode || "无说明"} · {item._count.posts} 篇投稿
                </option>
              ))}
            </select>
            <textarea className="input mt-3 w-full" placeholder="管理员备注" value={notes[claim.id] || ""} onChange={(e) => setNotes((old) => ({ ...old, [claim.id]: e.target.value }))} />
            <div className="mt-3 flex gap-2">
              <button className="btn-primary" disabled={!selected[claim.id]} onClick={() => void act(claim.id, "approve-claim")}>批准认领</button>
              <button className="btn-secondary" onClick={() => void act(claim.id, "reject-claim")}>拒绝</button>
            </div>
          </section>
        ))}
        {!claims.length ? <p className="text-brand-fg/60">暂无待审核认领申请。</p> : null}
      </div>
    </div>
  );
}

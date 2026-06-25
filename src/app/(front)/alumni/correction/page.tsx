'use client';

import { useRef, useState } from 'react';
import { Search, AlertTriangle, CheckCircle2, Loader2, Send, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type AlumniResult = {
  id: string;
  name: string;
  graduationClass: string;
  tags: string;
  university: string;
  major: string;
  city: string;
};

export default function AlumniCorrectionPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AlumniResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState('');

  // 申请表单
  const [selected, setSelected] = useState<AlumniResult | null>(null);
  const [requestedName, setRequestedName] = useState('');
  const [requestedClass, setRequestedClass] = useState('');
  const [requestedTags, setRequestedTags] = useState('');
  const [contact, setContact] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Honeypot
  const websiteRef = useRef<HTMLInputElement>(null);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q || q.length < 2) {
      setSearchError('请输入至少2个字符');
      return;
    }
    setSearching(true);
    setSearchError('');
    setResults([]);
    setSearched(true);
    try {
      const res = await fetch(`/api/alumni/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('搜索失败');
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setSearchError('搜索失败，请稍后重试');
    } finally {
      setSearching(false);
    }
  };

  const openForm = (item: AlumniResult) => {
    setSelected(item);
    setRequestedName(item.name);
    setRequestedClass(item.graduationClass);
    setRequestedTags(item.tags);
    setContact('');
    setReason('');
    setFormError('');
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    if (!selected) return;

    // 验证
    if (!contact.trim() || contact.trim().length > 100) {
      setFormError('请填写联系方式（不超过100字）');
      return;
    }
    if (!reason.trim() || reason.trim().length < 5 || reason.trim().length > 1000) {
      setFormError('修改说明至少5字，不超过1000字');
      return;
    }

    const newName = requestedName.trim() || '';
    const newClass = requestedClass.trim() || '';
    const newTags = requestedTags.trim() || '';

    if (!newName && !newClass && !newTags) {
      setFormError('请至少填写一项要修改的内容');
      return;
    }
    if (newName === selected.name && newClass === selected.graduationClass && newTags === selected.tags) {
      setFormError('修改内容与当前信息相同，请检查后重新提交');
      return;
    }
    if (newName.length > 50) {
      setFormError('姓名不超过50字');
      return;
    }
    if (newClass.length > 50) {
      setFormError('届别不超过50字');
      return;
    }
    if (newTags.length > 500) {
      setFormError('标签不超过500字');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      const formData = new FormData();
      formData.append('rosterId', selected.id);
      if (websiteRef.current) formData.append('website', websiteRef.current.value);
      if (newName) formData.append('requestedName', newName);
      if (newClass) formData.append('requestedGraduationClass', newClass);
      if (newTags) formData.append('requestedTags', newTags);
      formData.append('contact', contact.trim());
      formData.append('reason', reason.trim());

      const res = await fetch('/api/alumni/correction-requests', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '提交失败');
      }
      setSubmitted(true);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-10 md:px-8 md:py-12">
      <div className="glass-card-base p-5 md:p-8">
        {/* 头部 */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-3 py-1 text-xs tracking-[0.18em] text-[#7C3AED]">
              <Send size={14} /> CORRECTION
            </p>
            <h1 className="font-heading mt-3 text-3xl font-bold text-[#4C1D95] md:text-4xl">
              校友信息修改申请
            </h1>
            <p className="mt-2 text-sm leading-7 text-gray-700">
              如果你的校友信息有误，可以提交修改申请。申请不会立即生效，管理员审核后才会更新。
            </p>
          </div>
          <Link
            href="/alumni/search"
            className="btn-secondary shrink-0"
          >
            返回
          </Link>
        </div>

        {!selected && (
          <>
            {/* 搜索 */}
            <div className="mt-6 flex gap-3">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7C3AED]/40"
                />
                <input
                  type="text"
                  placeholder="输入你的姓名搜索..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="input w-full pl-9"
                  autoFocus
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={searching}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-5 py-2.5 text-sm text-[#7C3AED] transition hover:bg-[#7C3AED]/10 disabled:opacity-50"
              >
                {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                搜索
              </button>
            </div>

            {/* 搜索错误 */}
            {searchError && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <AlertTriangle size={16} />
                {searchError}
              </div>
            )}

            {/* 搜索结果 */}
            {searched && !searching && (
              <div className="mt-4">
                {results.length === 0 ? (
                  <div className="rounded-2xl border border-[#7C3AED]/10 px-4 py-8 text-center text-sm text-[#4C1D95]/40">
                    未找到匹配的校友。如果确认信息有误，请联系管理员。
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-[#4C1D95]/40">
                      找到 {results.length} 条记录
                    </p>
                    {results.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-[#7C3AED]/10 bg-white/50 px-4 py-3 transition hover:bg-white/90"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[#4C1D95]">{item.name}</p>
                          <p className="mt-0.5 text-xs text-[#4C1D95]/50">
                            {item.graduationClass || '届别未知'}
                            {item.university && ` · ${item.university}`}
                            {item.city && ` · ${item.city}`}
                          </p>
                        </div>
                        <button
                          onClick={() => openForm(item)}
                          className="cursor-pointer shrink-0 rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-3 py-1.5 text-xs text-[#7C3AED] transition hover:bg-[#7C3AED]/10"
                        >
                          申请修改
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
              请勿提交他人隐私信息或未经授权的联系方式。
            </div>
          </>
        )}

        {/* 申请表单 */}
        {selected && !submitted && (
          <div className="mt-6 space-y-5">
            <div className="rounded-2xl border border-[#7C3AED]/10 bg-[#FAF5FF] px-4 py-3">
              <p className="text-xs text-[#4C1D95]/40">当前信息</p>
              <p className="mt-1 text-sm font-medium text-[#4C1D95]">{selected.name}</p>
              <p className="text-xs text-[#4C1D95]/60">
                {selected.graduationClass || '届别未知'}
                {selected.university && ` · ${selected.university}`}
                {selected.city && ` · ${selected.city}`}
              </p>
            </div>

            {/* Honeypot - 对用户不可见 */}
            <input
              ref={websiteRef}
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              style={{ position: 'absolute', left: '-9999px' }}
              aria-hidden="true"
            />

            <div>
              <label className="mb-1 block text-sm font-medium text-[#4C1D95]">姓名</label>
              <input
                type="text"
                value={requestedName}
                onChange={(e) => setRequestedName(e.target.value)}
                className="input w-full"
                placeholder="留空表示不修改"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#4C1D95]">届别/班级</label>
              <input
                type="text"
                value={requestedClass}
                onChange={(e) => setRequestedClass(e.target.value)}
                className="input w-full"
                placeholder="留空表示不修改"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#4C1D95]">标签</label>
              <input
                type="text"
                value={requestedTags}
                onChange={(e) => setRequestedTags(e.target.value)}
                className="input w-full"
                placeholder="格式：大学 | 专业 | 城市。留空表示不修改"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#4C1D95]">
                联系方式 *
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="input w-full"
                placeholder="微信号、手机号或邮箱"
              />
              <p className="mt-1 text-xs text-[#4C1D95]/40">
                请留下可联系你的方式，便于管理员核实。
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#4C1D95]">
                修改说明 *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input w-full min-h-[80px] resize-y"
                placeholder="请描述需要修改的内容及原因"
                rows={3}
              />
            </div>

            {formError && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <AlertTriangle size={16} />
                {formError}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelected(null)}
                disabled={submitting}
                className="cursor-pointer rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-[#4C1D95]/60 transition hover:bg-gray-50 disabled:opacity-50"
              >
                返回
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-5 py-2.5 text-sm text-[#7C3AED] transition hover:bg-[#7C3AED]/10 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                提交申请
              </button>
            </div>
          </div>
        )}

        {/* 提交成功 */}
        {submitted && (
          <div className="mt-6 text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
              <CheckCircle2 size={28} />
            </div>
            <h2 className="font-heading mt-4 text-lg font-bold text-[#4C1D95]">
              申请已提交
            </h2>
            <p className="mt-2 text-sm text-[#4C1D95]/60">
              修改申请已提交，请等待管理员审核。
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => {
                  setSelected(null);
                  setSubmitted(false);
                  setResults([]);
                  setSearched(false);
                  setQuery('');
                }}
                className="cursor-pointer rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-4 py-2 text-sm text-[#7C3AED] transition hover:bg-[#7C3AED]/10"
              >
                继续修改其他校友
              </button>
              <Link
                href="/"
                className="btn-secondary"
              >
                返回首页
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

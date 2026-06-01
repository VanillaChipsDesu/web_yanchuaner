"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { Feather, Filter, Mail, PenSquare, X } from "lucide-react";
import storiesData from "@/data/stories.json";

type StoryRecord = {
  id: string;
  title: string;
  author: string;
  tags: string[];
  body: string;
  date: string;
};

type DraftState = {
  title: string;
  author: string;
  tag: string;
  content: string;
  contact: string;
};

const STORY_EMAIL = "yanchuan_alumni@163.com";

const initialDraft: DraftState = {
  title: "",
  author: "",
  tag: "专业真相",
  content: "",
  contact: "",
};

function formatDate(isoDate: string) {
  const [year = "", month = "", day = ""] = isoDate.split("-");
  if (!year || !month || !day) {
    return isoDate;
  }
  return `${year}.${month}.${day}`;
}

export default function AlumniStoriesPage() {
  const stories = storiesData as StoryRecord[];
  const [activeTag, setActiveTag] = useState("全部");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState<DraftState>(initialDraft);
  const [hasTriggeredMail, setHasTriggeredMail] = useState(false);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const story of stories) {
      for (const tag of story.tags) {
        tagSet.add(tag);
      }
    }
    return ["全部", ...Array.from(tagSet)];
  }, [stories]);

  const filteredStories = useMemo(() => {
    if (activeTag === "全部") {
      return stories;
    }
    return stories.filter((story) => story.tags.includes(activeTag));
  }, [activeTag, stories]);

  const submitByMail = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const subject = encodeURIComponent(
      `[燕川故事投稿] ${draft.title.trim() || "未命名稿件"}`
    );

    const bodyText = [
      "【投稿人】",
      draft.author.trim() || "未填写",
      "",
      "【标签】",
      draft.tag.trim() || "未填写",
      "",
      "【联系方式】",
      draft.contact.trim() || "未填写",
      "",
      "【稿件正文】",
      draft.content.trim() || "未填写",
      "",
      "【备注】",
      "本稿件仅在站长人工审核后才会发布到静态站点。",
    ].join("\n");

    const mailtoUrl = `mailto:${STORY_EMAIL}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
    window.location.href = mailtoUrl;
    setHasTriggeredMail(true);
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 pb-32 md:px-8 md:py-12 md:pb-36">
      <div className="glass-card-base p-5 md:p-8">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-3 py-1 text-xs tracking-[0.18em] text-[#7C3AED]">
              <Feather size={14} />
              STORY COLUMN
            </p>
            <h1 className="font-heading mt-3 text-3xl font-bold text-[#4C1D95] md:text-4xl">{"燕川故事 · 轻论坛专栏"}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-700 md:text-base">
              {"所有稿件均为前端静态展示，只通过“邮件投递 + 人工审核”上线。不设登录、不设站内发布，完全合规。"}
            </p>
          </div>

          <Link href="/" className="btn-secondary">
            {"返回指挥中心"}
          </Link>
        </header>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-3 md:p-4">
          <div className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#7C3AED]">
            <Filter size={14} />
            TAG FILTER
          </div>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const isActive = tag === activeTag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag(tag)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition md:text-sm ${
                    isActive
                      ? "border-[#7C3AED] bg-[#7C3AED]/10 text-[#4C1D95]"
                      : "border-gray-200 bg-gray-50 text-gray-600 hover:border-[#7C3AED]/40 hover:bg-white"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        <div className="story-waterfall mt-6">
          {filteredStories.map((story) => (
            <article
              key={story.id}
              className="story-waterfall-item card p-4 transition hover:-translate-y-1 hover:shadow-md md:p-5"
            >
              <div className="mb-3 flex items-center justify-between gap-2 text-xs text-[#7C3AED]">
                <span className="rounded-full border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-2.5 py-1">{formatDate(story.date)}</span>
                <span className="text-gray-500">{story.author}</span>
              </div>

              <h2 className="font-heading text-lg font-semibold leading-7 text-[#4C1D95] md:text-xl">{story.title}</h2>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {story.tags.map((tag) => (
                  <span
                    key={`${story.id}-${tag}`}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-gray-700 md:text-[15px]">{story.body}</p>
            </article>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          setIsModalOpen(true);
          setHasTriggeredMail(false);
        }}
        className="btn-primary fixed bottom-20 right-4 z-40 px-5 py-3 shadow-lg ring-1 ring-emerald-500/30 hover:ring-emerald-500/50 md:bottom-24 md:right-8"
      >
        <PenSquare size={16} />
        {"写信给母港"}
      </button>

      {isModalOpen ? (
        <div className="mobile-modal-shell fixed inset-0 z-[90] flex items-center justify-center px-4 py-8">
          <button type="button"
            aria-label={"关闭投稿窗口"}
            tabIndex={-1}
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm focus:outline-none"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="mobile-modal-panel safe-modal-panel relative z-10 w-full max-w-2xl rounded-3xl border border-[#7C3AED]/20 bg-white p-5 shadow-xl md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <h3 className="font-heading text-xl font-semibold text-[#4C1D95] md:text-2xl">{"投稿投递舱"}</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="关闭"
                tabIndex={0}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:ring-offset-2"
              >
                <X size={15} aria-hidden="true" />
                <span className="sr-only">关闭</span>
              </button>
            </div>

            <p className="text-sm leading-7 text-gray-600 md:text-base">
              {"投稿不会写入任何数据库。点击“以邮件投递”后，将调起本地邮箱发送给站长。稿件仅在审核合规后才会收录。"}
            </p>

            <form className="mt-4 space-y-3" onSubmit={submitByMail}>
              <input
                required
                aria-label="稿件标题"
                tabIndex={0}
                value={draft.title}
                onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                placeholder={"标题（例：大学避坑指南）"}
                className="input w-full"
              />

              <div className="grid gap-3 md:grid-cols-2">
                <input
                  required
                  aria-label="作者"
                  tabIndex={0}
                  value={draft.author}
                  onChange={(event) => setDraft((prev) => ({ ...prev, author: event.target.value }))}
                  placeholder={"作者（姓名 / 届别）"}
                  className="input w-full"
                />

                <select
                  value={draft.tag}
                  aria-label="选择标签"
                  tabIndex={0}
                  onChange={(event) => setDraft((prev) => ({ ...prev, tag: event.target.value }))}
                  className="input w-full"
                >
                  <option value="专业真相">{"专业真相"}</option>
                  <option value="避坑指南">{"避坑指南"}</option>
                  <option value="校园回忆">{"校园回忆"}</option>
                  <option value="青春寄语">{"青春寄语"}</option>
                </select>
              </div>

              <textarea
                required
                rows={7}
                aria-label="稿件正文"
                tabIndex={0}
                value={draft.content}
                onChange={(event) => setDraft((prev) => ({ ...prev, content: event.target.value }))}
                placeholder={"请输入稿件正文"}
                className="input w-full resize-y"
              />

              <input
                value={draft.contact}
                aria-label="联系方式"
                tabIndex={0}
                onChange={(event) => setDraft((prev) => ({ ...prev, contact: event.target.value }))}
                placeholder={"联系方式（可选）"}
                className="input w-full"
              />

              <button type="submit"
                className="btn-primary w-full justify-center"
              >
                <Mail size={17} />
                {"以邮件投递给站长"}
              </button>
            </form>

            {hasTriggeredMail ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                {`如果未成功唤起邮件应用，请将稿件直接发送至 ${STORY_EMAIL}。所有稿件均会经站长人工审核后再展示。`}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

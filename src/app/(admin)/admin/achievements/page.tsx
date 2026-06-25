"use client";

import { Badge } from "@/components/ui";
import { useResource } from "@/hooks/useResource";
import { CrudManager, type FieldConfig } from "@/components/admin/CrudManager";
import {
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENT_CATEGORY_LABELS,
  type AchievementCategory,
} from "@/lib/achievements";

type Achievement = {
  id: string;
  alumniName: string;
  graduationClass: string | null;
  title: string;
  category: AchievementCategory;
  description: string;
  organization: string | null;
  yearLabel: string | null;
  status: "DRAFT" | "PUBLISHED";
  sortOrder: number;
};

const FIELDS: FieldConfig[] = [
  { name: "alumniName", label: "校友姓名", required: true },
  { name: "graduationClass", label: "届别", placeholder: "例：2020届" },
  { name: "title", label: "成就标题", required: true, fullWidth: true },
  {
    name: "category",
    label: "类别",
    type: "select",
    options: ACHIEVEMENT_CATEGORIES.map((c) => ({
      value: c,
      label: ACHIEVEMENT_CATEGORY_LABELS[c],
    })),
  },
  { name: "yearLabel", label: "年份", placeholder: "例：2026" },
  { name: "organization", label: "机构或单位", placeholder: "学校、单位或组织名称" },
  { name: "sortOrder", label: "排序", type: "number" },
  {
    name: "status",
    label: "发布状态",
    type: "select",
    options: [
      { value: "DRAFT", label: "草稿" },
      { value: "PUBLISHED", label: "已发布" },
    ],
  },
  { name: "description", label: "成就简介", type: "textarea" },
];

export default function AdminAchievementsPage() {
  const res = useResource<Achievement>({
    endpoint: "/api/admin/achievements",
    listKey: "achievements",
  });

  return (
    <CrudManager<Achievement>
      title="校友成就墙管理"
      subtitle="新增、编辑并发布校友成就记录"
      fields={FIELDS}
      items={res.items}
      loading={res.loading}
      saving={res.saving}
      error={res.error}
      setError={res.setError}
      onCreate={res.create}
      onUpdate={res.update}
      onDelete={res.remove}
      deleteConfirm="确定删除这条成就记录？"
      validate={(form) =>
        !form.alumniName.trim() || !form.title.trim()
          ? "校友姓名和成就标题不能为空"
          : null
      }
      toForm={(a) => ({
        alumniName: a.alumniName,
        graduationClass: a.graduationClass || "",
        title: a.title,
        category: a.category,
        description: a.description,
        organization: a.organization || "",
        yearLabel: a.yearLabel || "",
        status: a.status,
        sortOrder: String(a.sortOrder),
      })}
      toPayload={(form) => ({
        ...form,
        sortOrder: Number(form.sortOrder) || 0,
      })}
      renderItem={(a) => (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading font-semibold text-brand-fg">{a.title}</h3>
            <Badge tone={a.status === "PUBLISHED" ? "success" : "neutral"}>
              {a.status === "PUBLISHED" ? "已发布" : "草稿"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            {a.alumniName}
            {a.graduationClass ? ` · ${a.graduationClass}` : ""}
            {" · "}
            {ACHIEVEMENT_CATEGORY_LABELS[a.category]}
          </p>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500">
            {a.description || "暂无简介"}
          </p>
        </>
      )}
    />
  );
}

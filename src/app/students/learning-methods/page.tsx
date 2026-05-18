import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, Mail, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "学习方法",
  description: "燕中校友数字母港 — 面向在校生的高中学习方法整理，涵盖时间管理、复习策略、心态调整等通用建议",
};

const methods = [
  {
    title: "时间管理",
    points: [
      "制定阶段计划：从学期计划到周计划再到每日任务，逐层分解，避免临时抱佛脚",
      "用好碎片时间：通勤、排队、课间等零散时间可以用于背单词、回顾笔记",
      "优先级矩阵：区分重要且紧急、重要不紧急、紧急不重要、不重要不紧急四类任务",
      "固定作息：保证充足睡眠，稳定的生物钟比熬夜刷题更有效",
      "定期复盘：每周末花15分钟回顾本周完成情况，调整下周计划",
    ],
  },
  {
    title: "错题与复盘",
    points: [
      "错题本不只是抄题，要记录错误原因：知识点漏洞、审题失误、计算错误还是思路偏差",
      "定期重做错题：当周错题周末重做，月末再回顾一次",
      "分析出题逻辑：每道错题都要追问「这道题考的是什么知识点」「我的思路在哪一步偏离了」",
      "同类错题归并：把同一知识点的错题放在一起，集中突破薄弱环节",
      "不追求错题本数量，追求真正掌握：一道题能讲给别人听才是真懂了",
    ],
  },
  {
    title: "考前节奏",
    points: [
      "考前一个月：回归基础，梳理知识框架，不再追求偏题怪题",
      "考前一周：调整作息，按考试时间安排复习科目，让大脑适应考试节奏",
      "考前一天：适度复习即可，准备好考试用品，不要熬夜",
      "考试当天：早餐正常吃，提前到场，深呼吸稳定心态",
      "每科考后：不对答案，不讨论，集中精力准备下一科",
    ],
  },
  {
    title: "信息整理",
    points: [
      "课堂笔记优先记录框架和逻辑，不要当录音机逐字抄写",
      "推荐使用思维导图、康奈尔笔记法等结构化方式整理知识点",
      "定期整理：每周花时间把本周所学内容串联成知识网络",
      "善用图表：流程图、对比表格、时间轴等可视化方式比纯文字更易记忆",
      "电子笔记和纸质笔记各有优势，选择最适合自己的方式即可",
    ],
  },
  {
    title: "心态调整",
    points: [
      "接受不完美：考试有起伏是正常的，关键在于从每次考试中学习",
      "专注自己能控制的：题目难度、分数线无法控制，但复习时间、方法、态度可以控制",
      "建立支持系统：和同学组队复习、向老师请教、和家长沟通，不要一个人硬扛",
      "适当放松：运动、音乐、散步都是有效的减压方式，不要把自己逼得太紧",
      "保持长期视角：高考是重要节点但不是终点，人生有很多条路可以走",
    ],
  },
];

export default function LearningMethodsPage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 md:px-8">
      <div className="glass-card-base p-6 md:p-8">
        <p className="inline-flex items-center gap-2 rounded-full border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-3 py-1 text-xs tracking-[0.18em] text-[#7C3AED]">
          <BookOpen size={14} /> LEARNING METHODS
        </p>
        <h1 className="font-heading mt-3 text-3xl font-bold text-[#4C1D95] md:text-4xl">学习方法</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-700 md:text-base">
          整理高中阶段的学习规划、时间管理、复习策略和心态调整方法。所有建议来自通用学习经验，具体安排应结合个人情况和老师指导。
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {methods.map((section) => (
            <div key={section.title} className="rounded-2xl border border-[#7C3AED]/10 bg-white/50 p-5">
              <h3 className="font-heading text-base font-semibold text-[#4C1D95]">{section.title}</h3>
              <ul className="mt-3 space-y-2">
                {section.points.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-5 text-gray-600">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7C3AED]/40" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
              <Shield size={16} className="text-amber-700" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-semibold text-amber-800">免责声明</h3>
              <p className="mt-1 text-xs leading-6 text-amber-700">
                本页面内容为通用学习方法整理，仅供参考。每个人的学习习惯和节奏不同，具体学习安排应结合个人实际情况和老师建议。不构成任何学习效果承诺。
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/students" className="btn-secondary inline-flex items-center gap-2 text-sm">
            <ArrowLeft size={16} />
            返回资源站
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-4 py-2.5 text-sm text-[#7C3AED] transition hover:bg-[#7C3AED]/10"
          >
            <Mail size={16} />
            联系我们
          </Link>
        </div>
      </div>
    </section>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  MapPin, Building2, UsersRound, GraduationCap,
  ChevronDown, ChevronUp, ArrowLeft, AlertCircle,
} from 'lucide-react';
import { PageShell, GlassCard, PageHeader, ButtonLink, DisclaimerBanner } from '@/components/ui';

const CityMapRenderer = dynamic(() => import('@/components/CityMapRenderer'), { ssr: false });

type CityStats = {
  city: string;
  count: number;
  lat: number;
  lng: number;
  universities: string[];
  majors: string[];
  classes: string[];
  members: Array<{
    name: string;
    university: string;
    major: string;
    graduationClass: string;
  }>;
};

type StatsData = {
  totalCities: number;
  totalAlumni: number;
  totalUniversities: number;
  totalMajors: number;
  cities: CityStats[];
  uncounted: number;
};

export default function UniversityMapPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCity, setExpandedCity] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/alumni/city-stats')
      .then((res) => {
        if (res.status === 401) throw new Error('请先验证访问口令后查看');
        if (!res.ok) throw new Error('数据加载失败，请稍后重试');
        return res.json();
      })
      .then((d) => setData(d))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleCity = (city: string) => {
    setExpandedCity((prev) => (prev === city ? null : city));
  };

  const statCards = data
    ? [
        { icon: MapPin, label: '覆盖城市', value: data.totalCities, color: 'text-brand', border: 'border-line', bg: 'bg-surface/30 backdrop-blur-md' },
        { icon: UsersRound, label: '校友人数', value: data.totalAlumni, color: 'text-brand', border: 'border-line', bg: 'bg-surface/30 backdrop-blur-md' },
        { icon: Building2, label: '大学数量', value: data.totalUniversities, color: 'text-brand', border: 'border-line', bg: 'bg-surface/30 backdrop-blur-md' },
        { icon: GraduationCap, label: '专业数量', value: data.totalMajors, color: 'text-brand', border: 'border-line', bg: 'bg-surface/30 backdrop-blur-md' },
      ]
    : [];

  return (
    <PageShell size="wide">
      <GlassCard className="p-6 md:p-8">
        <PageHeader
          eyebrow="UNIVERSITY MAP"
          eyebrowIcon={MapPin}
          title="大学城市分布"
          description="看看燕中校友的大学足迹点亮了哪些城市"
          action={
            <ButtonLink href="/alumni/radar" variant="secondary" icon={ArrowLeft} size="sm">
              返回通讯录
            </ButtonLink>
          }
        />

        <div className="mt-8">
          {/* Loading state */}
          {loading && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse rounded-2xl border border-line bg-surface/20 p-5">
                    <div className="h-10 w-10 rounded-xl bg-surface/30" />
                    <div className="mt-4 h-4 w-20 rounded bg-surface/30" />
                    <div className="mt-2 h-6 w-16 rounded bg-surface/30" />
                  </div>
                ))}
              </div>
              <div className="h-[360px] animate-pulse rounded-2xl bg-surface/20 md:h-96" />
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-8 text-center">
              <AlertCircle size={32} className="mx-auto text-rose-500" />
              <p className="mt-3 text-sm text-rose-200">{error}</p>
              {error.includes('访问口令') && (
                <Link
                  href="/"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-rose-500/30 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-500/20"
                >
                  返回首页验证
                </Link>
              )}
            </div>
          )}

          {/* Empty state */}
          {data && data.cities.length === 0 && !loading && (
            <div className="rounded-2xl border border-dashed border-line bg-surface/20 p-12 text-center">
              <MapPin size={40} className="mx-auto text-brand-fg/20" />
              <p className="mt-4 text-sm text-brand-fg/60">暂无城市分布数据</p>
              <p className="mt-1 text-xs text-brand-fg/40">校友数据收集中，敬请期待</p>
            </div>
          )}

          {/* Data loaded */}
          {data && data.cities.length > 0 && (
            <>
              {/* Stats grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map(({ icon: Icon, label, value, color, border, bg }) => (
                  <div key={label} className={`rounded-2xl border ${border} ${bg} p-5 shadow-sm`}>
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 shadow-sm border border-brand/20">
                      <Icon size={20} className={color} />
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-wide text-brand-fg/50">{label}</p>
                    <p className={`font-heading mt-1 text-2xl font-bold text-white`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Map */}
              <div className="mt-6 overflow-hidden rounded-2xl border border-line shadow-sm bg-surface/30 backdrop-blur-md">
                <CityMapRenderer cities={data.cities} />
                <div className="flex items-center gap-2 border-t border-line bg-surface/40 px-4 py-3">
                  <MapPin size={14} className="text-brand" />
                  <p className="text-xs text-brand-fg/50">
                    共 {data.cities.length} 个城市 · 圆圈越大代表该城市校友人数越多
                  </p>
                </div>
              </div>

              {/* City ranking */}
              <div className="mt-8">
                <h2 className="font-heading text-lg font-semibold text-[#4C1D95]">城市排行</h2>
                <p className="mt-1 text-sm text-gray-500">按校友人数排序，点击展开详情</p>

                <div className="mt-4 max-h-[600px] overflow-y-auto space-y-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {data.cities.map((city, index) => (
                    <div key={city.city} className="overflow-hidden rounded-xl border border-brand/10">
                      <button
                        type="button"
                        onClick={() => toggleCity(city.city)}
                        className="flex w-full items-center gap-3 bg-white/50 px-4 py-3.5 text-left transition hover:bg-[#FAF5FF] md:gap-4 md:px-5"
                      >
                        <span className="w-5 shrink-0 text-center text-sm font-bold text-[#7C3AED]/60">
                          {index + 1}
                        </span>
                        <span className="font-heading flex-1 text-sm font-semibold text-[#4C1D95] md:text-base">
                          {city.city}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-brand/20 bg-brand/5 px-2.5 py-0.5 text-xs font-medium text-[#7C3AED] shrink-0">
                          <UsersRound size={12} />
                          {city.count}
                        </span>
                        {expandedCity === city.city ? (
                          <ChevronUp size={16} className="shrink-0 text-gray-400" />
                        ) : (
                          <ChevronDown size={16} className="shrink-0 text-gray-400" />
                        )}
                      </button>

                      {expandedCity === city.city && (
                        <div className="border-t border-brand/5 bg-white/30 px-4 py-4 md:px-5">
                          {city.members.length > 0 ? (
                            <div className="overflow-hidden rounded-xl border border-brand/10 bg-white/70">
                              <div className="grid grid-cols-[1.05fr_1.25fr_1fr_0.9fr] gap-3 border-b border-brand/10 bg-brand/5 px-4 py-3 text-xs font-medium text-gray-500">
                                <span>姓名</span>
                                <span>大学</span>
                                <span>专业</span>
                                <span>班级</span>
                              </div>
                              <div className="divide-y divide-brand/5">
                                {city.members.map((member) => (
                                  <div
                                    key={`${member.name}-${member.graduationClass}-${member.university}-${member.major}`}
                                    className="grid grid-cols-[1.05fr_1.25fr_1fr_0.9fr] gap-3 px-4 py-3 text-sm text-gray-700"
                                  >
                                    <span className="font-medium text-[#4C1D95]">{member.name}</span>
                                    <span>{member.university || '暂无'}</span>
                                    <span>{member.major || '暂无'}</span>
                                    <span>{member.graduationClass || '暂无'}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-dashed border-brand/10 bg-white/70 px-4 py-4 text-sm text-gray-400">
                              暂无明细数据
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {data.uncounted > 0 && (
                  <p className="mt-3 text-xs text-gray-400">
                    * 另有 {data.uncounted} 位校友的城市信息暂未收录在地图中
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Privacy notice */}
        <DisclaimerBanner title="隐私与合规说明" className="mt-8">
          本页面仅展示城市级别的校友大学分布统计，不显示任何个人联系方式、具体地址或位置信息。
          所有数据来源于校友自愿登记的开源通讯录，仅供校友间联系与参考。
          如需更正或删除您的信息，请联系管理员。
        </DisclaimerBanner>
      </GlassCard>
    </PageShell>
  );
}

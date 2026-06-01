"use client";

import Link from "next/link";
import NextImage from "next/image";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, IdCard, ImagePlus, Rocket, X } from "lucide-react";

const CANVAS_WIDTH = 2752;
const CANVAS_HEIGHT = 1548;
const PANEL_LEFT = 1740;
const PANEL_RIGHT = 2427;
const PANEL_CENTER_X = Math.round((PANEL_LEFT + PANEL_RIGHT) / 2);
const FALLBACK_NAME = "燕川校友";
const FALLBACK_CLASS = "2025届 | 创始校友";
const FALLBACK_CERTIFICATE_NO = "YC-ALUM-PENDING";
const EMOTIONAL_TEXT = "十年之约 · 2035 见";
const YC_LOGO_TEXT = "燕川校友数字纪念卡";
const YC_LOGO_SUBTEXT = "YANCHUAN ALUMNI MEMORIAL";
const CARD_DISCLAIMER_TEXT =
  "*** 本卡片仅为个人公益平台生成之纪念凭证，不具备任何官方效力。**";
const AVATAR_CENTER_Y = 430;
const AVATAR_RADIUS = 170;

type ParsedClass = {
  year: string;
  classNo: string;
  compact: string;
};

function loadCanvasImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image not found"));
    img.src = src;
  });
}

function drawDefaultAvatarPlaceholder(context: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) {
  const gradient = context.createRadialGradient(centerX - radius * 0.2, centerY - radius * 0.3, radius * 0.25, centerX, centerY, radius);
  gradient.addColorStop(0, "rgba(196, 181, 253, 0.9)"); // purple-300
  gradient.addColorStop(0.5, "rgba(124, 58, 237, 0.9)"); // purple-600
  gradient.addColorStop(1, "rgba(76, 29, 149, 0.95)"); // purple-900

  context.fillStyle = gradient;
  context.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);

  context.strokeStyle = "rgba(250, 245, 255, 0.85)"; // purple-50
  context.lineWidth = 10;
  context.beginPath();
  context.arc(centerX, centerY - radius * 0.18, radius * 0.28, 0, Math.PI * 2);
  context.stroke();

  context.beginPath();
  context.arc(centerX, centerY + radius * 0.42, radius * 0.5, Math.PI * 1.05, Math.PI * 1.95);
  context.stroke();

  context.fillStyle = "rgba(255, 255, 255, 0.92)";
  context.font = "700 54px 'JetBrains Mono', 'Noto Sans Mono', monospace";
  context.textAlign = "center";
  context.fillText("YC", centerX, centerY + radius * 0.75);
}

function drawCyberAvatarRing(context: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) {
  context.save();

  context.strokeStyle = "rgba(124, 58, 237, 0.95)"; // purple-600
  context.lineWidth = 8;
  context.shadowColor = "rgba(167, 139, 250, 0.8)"; // purple-400
  context.shadowBlur = 26;
  context.beginPath();
  context.arc(centerX, centerY, radius + 10, 0, Math.PI * 2);
  context.stroke();

  context.shadowBlur = 0;
  context.strokeStyle = "rgba(196, 181, 253, 0.85)"; // purple-300
  context.lineWidth = 3;
  context.beginPath();
  context.arc(centerX, centerY, radius + 24, 0, Math.PI * 2);
  context.stroke();

  for (let i = 0; i < 36; i += 1) {
    const angle = (Math.PI * 2 * i) / 36;
    const tickStart = radius + 24;
    const tickLength = i % 3 === 0 ? 18 : 10;
    const x1 = centerX + Math.cos(angle) * tickStart;
    const y1 = centerY + Math.sin(angle) * tickStart;
    const x2 = centerX + Math.cos(angle) * (tickStart + tickLength);
    const y2 = centerY + Math.sin(angle) * (tickStart + tickLength);

    context.strokeStyle = i % 3 === 0 ? "rgba(139, 92, 246, 0.95)" : "rgba(196, 181, 253, 0.7)"; // purple-500 : purple-300
    context.lineWidth = i % 3 === 0 ? 3 : 2;
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
  }

  context.restore();
}

async function drawAvatarArea(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  avatarSource: string
) {
  context.save();
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.clip();

  if (avatarSource) {
    try {
      const avatarImage = await loadCanvasImage(avatarSource);
      const cropSide = Math.min(avatarImage.width, avatarImage.height);
      const cropX = Math.max(0, (avatarImage.width - cropSide) / 2);
      const cropY = Math.max(0, (avatarImage.height - cropSide) / 2);
      context.drawImage(avatarImage, cropX, cropY, cropSide, cropSide, centerX - radius, centerY - radius, radius * 2, radius * 2);
    } catch {
      drawDefaultAvatarPlaceholder(context, centerX, centerY, radius);
    }
  } else {
    drawDefaultAvatarPlaceholder(context, centerX, centerY, radius);
  }

  context.restore();
  drawCyberAvatarRing(context, centerX, centerY, radius);
}

function normalizeYear(raw: string) {
  const source = raw.replace(/\s+/g, "");
  if (source.includes("高三")) {
    return "2022";
  }
  if (source.includes("高二")) {
    return "2024";
  }
  if (source.includes("高一")) {
    return "2025";
  }

  const fullYear = source.match(/(20\d{2})\s*级?/);
  if (fullYear) {
    return fullYear[1];
  }

  const shortYear = source.match(/(^|\D)(\d{2})\s*级/);
  if (shortYear) {
    return `20${shortYear[2]}`;
  }

  return "";
}

function normalizeClassNo(raw: string) {
  const source = raw.replace(/\s+/g, "");
  const explicitClass = source.match(/[（(]?(\d{1,2})[）)]?班/);
  if (explicitClass) {
    return String(Number(explicitClass[1]));
  }
  return "";
}

function parseClassText(raw: string): ParsedClass {
  const compact = raw.replace(/[\s（()）【】\[\]{}<>《》,，、._-]/g, "").toLowerCase();
  return {
    year: normalizeYear(raw),
    classNo: normalizeClassNo(raw),
    compact,
  };
}

function isClassMatch(inputClass: string, standardClass: string) {
  const input = parseClassText(inputClass);
  const standard = parseClassText(standardClass);

  if (!input.compact || !standard.compact) {
    return false;
  }

  if (input.year && input.classNo && standard.year && standard.classNo) {
    return input.year === standard.year && input.classNo === standard.classNo;
  }

  if (input.classNo && standard.classNo && input.classNo === standard.classNo) {
    if (!input.year || !standard.year) {
      return true;
    }
    if (input.year === standard.year) {
      return true;
    }
  }

  return standard.compact.includes(input.compact) || input.compact.includes(standard.compact);
}

function randomCaptchaNumber() {
  return Math.floor(Math.random() * 10) + 1;
}

const CORE_MEMBERS = ["黄湘林", "左佳维", "张正朋", "吴桐", "杨菁", "赖盈燕", "朱国震", "张一鸣"];

function getHonorLevel(name: string): "core" | null {
  if (CORE_MEMBERS.includes(name)) {
    return "core";
  }
  return null;
}

function drawHonorBadge(context: CanvasRenderingContext2D, type: "founder" | "core") {
  context.save();
  const badgeX = PANEL_RIGHT - 180;
  const badgeY = 180;
  const size = 65;

  if (type === "founder") {
    context.beginPath();
    context.arc(badgeX, badgeY, size + 20, 0, Math.PI * 2);
    context.strokeStyle = "rgba(253, 224, 71, 0.4)";
    context.lineWidth = 4;
    context.stroke();

    context.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const x = badgeX + Math.cos(angle) * size;
        const y = badgeY + Math.sin(angle) * size;
        if (i === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
    }
    context.closePath();

    const grad = context.createLinearGradient(badgeX, badgeY - size, badgeX, badgeY + size);
    grad.addColorStop(0, "#FDE047");
    grad.addColorStop(1, "#EAB308");

    context.fillStyle = grad;
    context.shadowColor = "rgba(234, 179, 8, 0.6)";
    context.shadowBlur = 20;
    context.fill();

    context.strokeStyle = "#FEF08A";
    context.lineWidth = 4;
    context.stroke();

    context.shadowBlur = 0;
    context.fillStyle = "#422006";
    context.font = "800 22px 'JetBrains Mono', 'Noto Sans Mono', monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("FOUNDER", badgeX, badgeY + 2);

  } else if (type === "core") {
    context.beginPath();
    context.arc(badgeX, badgeY, size + 15, 0, Math.PI * 2);
    context.strokeStyle = "rgba(124, 58, 237, 0.4)"; // purple-600
    context.lineWidth = 4;
    context.stroke();

    context.beginPath();
    context.arc(badgeX, badgeY, size, 0, Math.PI * 2);

    const grad = context.createLinearGradient(badgeX, badgeY - size, badgeX, badgeY + size);
    grad.addColorStop(0, "#8B5CF6"); // purple-500
    grad.addColorStop(1, "#6D28D9"); // purple-700

    context.fillStyle = grad;
    context.shadowColor = "rgba(124, 58, 237, 0.6)";
    context.shadowBlur = 20;
    context.fill();

    context.strokeStyle = "#C4B5FD"; // purple-300
    context.lineWidth = 4;
    context.stroke();

    context.shadowBlur = 0;
    context.save();
    context.clip();
    context.beginPath();
    for (let i = badgeY - size; i < badgeY + size; i += 6) {
       context.moveTo(badgeX - size, i);
       context.lineTo(badgeX + size, i);
    }
    context.strokeStyle = "rgba(255, 255, 255, 0.15)";
    context.lineWidth = 1;
    context.stroke();
    context.restore();

    context.beginPath();
    context.arc(badgeX, badgeY, size - 12, 0, Math.PI * 2);
    context.strokeStyle = "rgba(196, 181, 253, 0.6)"; // purple-300
    context.setLineDash([5, 5]);
    context.lineWidth = 2;
    context.stroke();
    context.setLineDash([]);

    context.fillStyle = "#FFFFFF"; // white
    context.font = "800 20px 'JetBrains Mono', 'Noto Sans Mono', monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("EST. 2025", badgeX, badgeY + 2);
  }

  context.restore();
}

export default function AlumniCertificatePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const bgInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState("");
  const [className, setClassName] = useState("");
  const [certificateNo, setCertificateNo] = useState(FALLBACK_CERTIFICATE_NO);
  const [numA, setNumA] = useState(1);
  const [numB, setNumB] = useState(1);
  const [captchaInput, setCaptchaInput] = useState("");
  const [avatarDataUrl, setAvatarDataUrl] = useState("");
  const [avatarFileName, setAvatarFileName] = useState("");
  const [bgUrl, setBgUrl] = useState("");
  const [bgFileName, setBgFileName] = useState("");
  const [bgUploading, setBgUploading] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState("");
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const regenerateCaptcha = useCallback(() => {
    setNumA(randomCaptchaNumber());
    setNumB(randomCaptchaNumber());
    setCaptchaInput("");
  }, []);

  const handleAvatarUpload = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      alert("请上传图片格式文件");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const nextDataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!nextDataUrl) {
        alert("影像读取失败，请重试");
        return;
      }

      setAvatarDataUrl(nextDataUrl);
      setAvatarFileName(selectedFile.name);
    };
    reader.onerror = () => {
      alert("影像读取失败，请重试");
    };
    reader.readAsDataURL(selectedFile);
    event.target.value = "";
  }, []);

  const clearAvatar = useCallback(() => {
    setAvatarDataUrl("");
    setAvatarFileName("");
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  }, []);

  const handleBgUpload = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }
    if (!selectedFile.type.startsWith("image/")) {
      alert("请上传图片格式文件");
      event.target.value = "";
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert("背景图过大，请使用 10MB 以内的文件");
      event.target.value = "";
      return;
    }

    setBgUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", selectedFile);
      const res = await fetch("/api/alumni/certificate/upload-bg", {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) {
        alert(data?.error || "背景上传失败，请重试");
        return;
      }
      setBgUrl(data.url);
      setBgFileName(selectedFile.name);
    } catch {
      alert("背景上传失败，请检查网络后重试");
    } finally {
      setBgUploading(false);
      event.target.value = "";
    }
  }, []);

  const clearBg = useCallback(() => {
    setBgUrl("");
    setBgFileName("");
    if (bgInputRef.current) {
      bgInputRef.current.value = "";
    }
  }, []);

  const drawCertificate = useCallback(async (inputName: string, inputClassName: string, serialNo: string, avatarSource: string, bgSource: string) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    try {
      const bgImage = await loadCanvasImage(bgSource || "/card.jpg");
      context.drawImage(bgImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } catch {
      const fallbackBg = context.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      fallbackBg.addColorStop(0, "#FAF5FF");
      fallbackBg.addColorStop(1, "#F3E8FF");
      context.fillStyle = fallbackBg;
      context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    const overlay = context.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    overlay.addColorStop(0, "rgba(255, 255, 255, 0.4)");
    overlay.addColorStop(0.6, "rgba(255, 255, 255, 0.7)");
    overlay.addColorStop(1, "rgba(255, 255, 255, 0.95)");
    context.fillStyle = overlay;
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    context.textAlign = "center";

    context.shadowBlur = 0;
    context.fillStyle = "#4C1D95";
    context.font = "700 52px 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif";
    context.fillText(YC_LOGO_TEXT, PANEL_CENTER_X, 176);

    context.fillStyle = "#6D28D9";
    context.font = "500 30px 'JetBrains Mono', 'Noto Sans Mono', monospace";
    context.fillText(YC_LOGO_SUBTEXT, PANEL_CENTER_X, 236);

    await drawAvatarArea(context, PANEL_CENTER_X, AVATAR_CENTER_Y, AVATAR_RADIUS, avatarSource);

    context.shadowColor = "rgba(124, 58, 237, 0.25)";
    context.shadowBlur = 15;
    context.fillStyle = "#4C1D95";
    context.font = "700 108px 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif";
    context.fillText(inputName || FALLBACK_NAME, PANEL_CENTER_X, 760);

    context.shadowBlur = 4;
    context.fillStyle = "#5B21B6";
    context.font = "600 66px 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif";
    context.fillText(inputClassName || FALLBACK_CLASS, PANEL_CENTER_X, 874);

    context.shadowBlur = 0;
    context.fillStyle = "#6D28D9";
    context.font = "500 42px 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif";
    context.fillText(EMOTIONAL_TEXT, PANEL_CENTER_X, 1012);

    context.fillStyle = "#7C3AED";
    context.font = "500 50px 'JetBrains Mono', 'Noto Sans Mono', monospace";
    context.fillText(serialNo, PANEL_CENTER_X, 1158);

    context.fillStyle = "rgba(76, 29, 149, 0.5)";
    context.font = "500 14px 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif";
    context.fillText(CARD_DISCLAIMER_TEXT, PANEL_CENTER_X, 1236);

    const honorLevel = getHonorLevel(inputName);
    if (honorLevel) {
      drawHonorBadge(context, honorLevel);
    }

    setPreviewDataUrl(canvas.toDataURL("image/jpeg", 0.92));
  }, []);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return "";
    }

    const base64Data = canvas.toDataURL("image/jpeg", 0.92);
    setPreviewDataUrl(base64Data);
    return base64Data;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const syncPreview = async () => {
      const activeName = name.trim() || FALLBACK_NAME;
      const activeClassName = className.trim() || FALLBACK_CLASS;
      await drawCertificate(activeName, activeClassName, certificateNo, avatarDataUrl, bgUrl);
      if (isMounted) {
        setIsPreviewVisible(true);
      }
    };

    void syncPreview();

    return () => {
      isMounted = false;
    };
  }, [name, className, certificateNo, avatarDataUrl, bgUrl, drawCertificate]);

  useEffect(() => {
    regenerateCaptcha();
  }, [regenerateCaptcha]);

  const handleGenerate = async () => {
    const userAnswer = Number(captchaInput.trim());
    if (!Number.isInteger(userAnswer) || userAnswer !== numA + numB) {
      alert("算术验证码错误，请重新计算");
      regenerateCaptcha();
      return;
    }

    const trimmedName = name.trim();
    const trimmedClass = className.trim();

    if (!trimmedName || !trimmedClass) {
      alert("请输入完整的校友信息");
      return;
    }

    try {
      const res = await fetch(`/api/alumni/verify?name=${encodeURIComponent(trimmedName)}`);
      const data = await res.json();

      if (!data.found || !data.match) {
        alert("抱歉，未在已登记名单中找到匹配信息。请核对姓名与班级（需与登记信息完全一致）。");
        return;
      }

      const match = data.match;
      if (!isClassMatch(trimmedClass, match.graduationClass)) {
        alert("抱歉，班级不匹配。请核对班级信息（需与登记信息一致）。");
        return;
      }

      const verifiedName = match.name;
      const verifiedClassName = match.graduationClass;
      const verifiedFixedID = match.id;

      setIsRendering(true);
      setIsSuccess(false);
      setIsPreviewVisible(false);
      setName(verifiedName);
      setClassName(verifiedClassName);
      setCertificateNo(verifiedFixedID);
      await drawCertificate(verifiedName, verifiedClassName, verifiedFixedID, avatarDataUrl, bgUrl);
      handleDownload();
      // 身份核验完成（不记录用户敏感信息到控制台）
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      setIsPreviewVisible(true);
      setIsRendering(false);
      setIsSuccess(true);
      regenerateCaptcha();
      window.setTimeout(() => {
        setIsSuccess(false);
      }, 1200);
    } catch {
      alert("验证服务暂时不可用，请稍后重试。");
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8 md:py-10">
      {/* Hero — 仪式感顶部 */}
      <header className="relative mb-6 overflow-hidden rounded-3xl border border-[#7C3AED]/15 bg-gradient-to-br from-white via-[#F5EDFF] to-[#EDE2FF] p-4 shadow-[0_8px_30px_-12px_rgba(124,58,237,0.18)] md:mb-8 md:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-28 -top-28 h-52 w-52 rounded-full bg-[#A78BFA]/22 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-36 -left-20 h-56 w-56 rounded-full bg-[#7C3AED]/14 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-8 top-2 h-px bg-gradient-to-r from-transparent via-[#7C3AED]/35 to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-8 bottom-2 h-px bg-gradient-to-r from-transparent via-[#7C3AED]/35 to-transparent"
        />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#7C3AED]/20 bg-white/75 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-[#7C3AED] shadow-sm backdrop-blur">
              <IdCard size={12} aria-hidden="true" />
              Yanchuan Alumni Memorial Card
            </span>
            <h1 className="font-heading mt-3 text-[2rem] font-bold leading-tight text-[#3B0764] md:text-[36px] md:leading-[1.12]">
              {"燕川中学校友"}
              <span className="bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#5B21B6] bg-clip-text text-transparent">
                {"电子纪念卡"}
              </span>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#5B21B6]/82 md:text-[14px] md:leading-7">
              {"输入姓名与班级，核验通过后即可生成属于你的专属电子纪念卡。"}
              <br className="hidden md:inline" />
              {"为这段共同的母港时光，留下一枚可以收藏与分享的印记。"}
            </p>
            <div className="mt-4 inline-flex items-center gap-3 rounded-full border border-[#7C3AED]/18 bg-white/72 px-3.5 py-1.25 text-[11px] text-[#5B21B6] shadow-sm backdrop-blur md:text-sm">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#7C3AED]" aria-hidden="true" />
              {"十年之约 · 2035 见"}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 md:flex-col md:items-end md:gap-2">
            <div className="rounded-2xl border border-[#7C3AED]/18 bg-white/80 px-3.5 py-2.5 text-right shadow-sm backdrop-blur">
              <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-[#7C3AED]/70">
                Certificate
              </p>
              <p className="font-heading mt-0.5 text-sm font-semibold text-[#4C1D95] md:text-base">
                Est. 2025
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        {/* 预览区 — 放到上方居中展示 */}
        <div className="rounded-3xl border border-[#7C3AED]/12 bg-white p-5 shadow-[0_6px_24px_-12px_rgba(124,58,237,0.18)] md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#7C3AED]/70">
                Preview
              </p>
              <p className="mt-0.5 text-sm font-medium text-[#4C1D95] md:text-[15px]">
                {isSuccess
                  ? "纪念卡生成完毕，长按或右键即可保存。"
                  : "实时预览 · 校验通过后将刷新最终编号"}
              </p>
            </div>
            <span className="hidden rounded-full border border-[#7C3AED]/20 bg-[#FAF5FF] px-3 py-1 text-[11px] font-medium tracking-wide text-[#7C3AED] md:inline-flex">
              16 : 9 · 2752 × 1548
            </span>
          </div>

          <div
            className={`relative mx-auto w-full max-w-[920px] overflow-hidden rounded-2xl border border-[#7C3AED]/20 bg-gradient-to-br from-[#FAF5FF] via-white to-[#F3E8FF] p-2 shadow-inner transition-opacity duration-500 md:p-3 ${
              isPreviewVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="overflow-hidden rounded-xl border border-[#7C3AED]/15 bg-white">
              {previewDataUrl ? (
                <NextImage
                  src={previewDataUrl}
                  alt="电子纪念卡预览"
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 840px"
                  className={`mx-auto block aspect-video h-auto w-full max-w-[840px] transition duration-500 ${isSuccess ? "scale-[1.02]" : "scale-100"}`}
                />
              ) : (
                <div className="mx-auto aspect-video w-full max-w-[840px] animate-pulse bg-[#F3E8FF]" />
              )}
            </div>
          </div>

          <p className="mt-4 text-center text-[11px] leading-5 text-[#5B21B6]/55 md:text-xs">
            {"本卡片仅为个人公益平台生成之纪念凭证，不具备任何官方效力。"}
          </p>
        </div>

        {/* 输入区 — 左侧信息 + 校验，右侧上传 */}
        <aside className="rounded-3xl border border-[#7C3AED]/12 bg-white p-5 shadow-[0_6px_24px_-12px_rgba(124,58,237,0.18)] md:p-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-start">
            <div className="space-y-6">
              <fieldset className="space-y-4 rounded-2xl border border-[#7C3AED]/10 bg-[#FAF5FF]/50 p-5">
                <legend className="mb-3 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7C3AED]">
                  基础信息
                </legend>
                <div>
                  <label htmlFor="alumni-name" className="block text-sm font-medium text-[#4C1D95]">
                    {"姓名"}
                  </label>
                  <input
                    id="alumni-name"
                    type="text"
                    tabIndex={0}
                    aria-label="姓名"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="请输入与登记一致的姓名"
                    className="input mt-2 w-full !rounded-2xl !border-transparent !bg-[#F8F5FF] placeholder:text-slate-400 shadow-sm focus:!border-[#7C3AED] focus:!bg-white focus:!shadow-[0_0_0_3px_rgba(124,58,237,0.14)]"
                  />
                </div>

                <div>
                  <label htmlFor="alumni-class" className="block text-sm font-medium text-[#4C1D95]">
                    {"班级"}
                  </label>
                  <input
                    id="alumni-class"
                    type="text"
                    tabIndex={0}
                    aria-label="班级"
                    value={className}
                    onChange={(event) => setClassName(event.target.value)}
                    placeholder="例如：2025届 1 班"
                    className="input mt-2 w-full !rounded-2xl !border-transparent !bg-[#F8F5FF] placeholder:text-slate-400 shadow-sm focus:!border-[#7C3AED] focus:!bg-white focus:!shadow-[0_0_0_3px_rgba(124,58,237,0.14)]"
                  />
                </div>
              </fieldset>

              <fieldset className="space-y-4 rounded-2xl border border-[#7C3AED]/10 bg-[#FAF5FF]/50 p-5">
                <legend className="mb-3 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7C3AED]">
                  安全校验
                </legend>
                <label htmlFor="alumni-captcha" className="block text-sm font-medium text-[#4C1D95]">
                  {`请回答：${numA} + ${numB} = ?`}
                </label>
                <input
                  id="alumni-captcha"
                  type="text"
                  tabIndex={0}
                  aria-label="安全校验答案"
                  inputMode="numeric"
                  value={captchaInput}
                  onChange={(event) => setCaptchaInput(event.target.value)}
                  placeholder="请输入计算结果"
                  className="input mt-2 w-full !rounded-2xl !border-transparent !bg-[#F8F5FF] placeholder:text-slate-400 shadow-sm focus:!border-[#7C3AED] focus:!bg-white focus:!shadow-[0_0_0_3px_rgba(124,58,237,0.14)]"
                />

                <div className="rounded-2xl bg-slate-100/80 px-4 py-3 text-sm text-slate-500">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
                    Certificate No.
                  </p>
                  <p className="font-heading mt-1 truncate text-base font-semibold text-slate-700">
                    {certificateNo}
                  </p>
                </div>
              </fieldset>
            </div>

            <div className="space-y-6">
              <fieldset className="space-y-4 rounded-2xl border border-[#7C3AED]/10 bg-[#FAF5FF]/50 p-5">
                <legend className="mb-3 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7C3AED]">
                  影像与背景（可选）
                </legend>

                <input
                  ref={avatarInputRef}
                  id="alumni-avatar"
                  type="file"
                  accept="image/*"
                  aria-label="上传头像影像"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#7C3AED]/35 bg-[#FAF5FF] px-4 py-3 text-sm font-medium text-[#6D28D9] shadow-sm transition hover:border-[#7C3AED]/60 hover:bg-white"
                >
                  <ImagePlus size={16} aria-hidden="true" />
                  <span>{"上传头像影像"}</span>
                </button>

                <div className="space-y-2">
                  {avatarDataUrl ? (
                    <div className="flex items-center gap-3">
                      <NextImage
                        src={avatarDataUrl}
                        alt={"头像预览"}
                        width={44}
                        height={44}
                        unoptimized
                        className="h-11 w-11 rounded-full border border-[#7C3AED]/40 object-cover shadow-sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#4C1D95]">{avatarFileName || "已载入自定义影像"}</p>
                        <p className="text-xs leading-5 text-slate-500">上传后会优先应用到纪念卡头像位。</p>
                      </div>
                      <button type="button"
                        onClick={clearAvatar}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2"
                        aria-label={"移除影像"}
                        tabIndex={0}
                      >
                        <X size={14} aria-hidden="true" />
                        <span className="sr-only">移除影像</span>
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs leading-6 text-slate-500 md:text-[13px]">{"未上传时使用默认徽标头像。"}</p>
                  )}
                </div>

                <input
                  ref={bgInputRef}
                  id="alumni-bg"
                  type="file"
                  accept="image/*"
                  aria-label="上传专属背景"
                  className="hidden"
                  onChange={handleBgUpload}
                />
                <button
                  type="button"
                  onClick={() => bgInputRef.current?.click()}
                  disabled={bgUploading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#7C3AED]/35 bg-[#FAF5FF] px-4 py-3 text-sm font-medium text-[#6D28D9] shadow-sm transition hover:border-[#7C3AED]/60 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ImagePlus size={16} aria-hidden="true" />
                  <span>{bgUploading ? "背景处理中…" : "上传专属背景（16:9）"}</span>
                </button>
                <div className="space-y-2">
                  {bgUrl ? (
                    <div className="flex items-center gap-3">
                      <NextImage
                        src={bgUrl}
                        alt={"背景预览"}
                        width={56}
                        height={32}
                        unoptimized
                        className="h-8 w-14 rounded border border-[#7C3AED]/30 object-cover shadow-sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#4C1D95]">{bgFileName || "已载入个人背景"}</p>
                        <p className="text-xs leading-5 text-slate-500">会自动裁切为 16:9 并应用到卡片背景。</p>
                      </div>
                      <button type="button"
                        onClick={clearBg}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2"
                        aria-label={"移除背景"}
                        tabIndex={0}
                      >
                        <X size={14} aria-hidden="true" />
                        <span className="sr-only">移除背景</span>
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs leading-6 text-slate-500 md:text-[13px]">{"未上传时使用站点默认 16:9 底图。"}</p>
                  )}
                </div>
              </fieldset>
            </div>
          </div>

          <div className="mt-5 flex flex-col items-center justify-center gap-3 border-t border-[#7C3AED]/10 pt-4 pb-0 md:flex-row">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isRendering}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#5B21B6] via-[#6D28D9] to-[#7C3AED] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_14px_30px_-14px_rgba(124,58,237,0.65)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-16px_rgba(124,58,237,0.75)] disabled:cursor-not-allowed disabled:opacity-70 md:w-auto md:min-w-[240px] ${
                isSuccess ? "scale-[1.02] ring-2 ring-[#C4B5FD]" : ""
              } ${isRendering ? "animate-pulse" : ""}`}
            >
              {isSuccess ? <CheckCircle2 size={18} /> : <Rocket size={18} />}
              <span>
                {isRendering
                  ? "身份核验中…"
                  : isSuccess
                    ? "生成成功"
                    : "核验并生成纪念卡"}
              </span>
            </button>

            <Link
              href="/"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-[#7C3AED]/30 bg-white/70 px-5 py-3.5 text-sm font-medium text-[#6D28D9] transition hover:border-[#7C3AED]/50 hover:bg-[#FAF5FF] md:w-auto md:min-w-[160px]"
            >
              {"返回首页"}
            </Link>
          </div>
        </aside>
      </div>

      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="hidden" />
    </section>
  );
}

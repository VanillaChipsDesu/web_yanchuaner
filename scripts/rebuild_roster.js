const fs = require("fs");
const path = require("path");

const csvPath = path.join(__dirname, "../alumni_roster.csv");
const sourcePath = path.join(__dirname, "source_alumni.json");
const starOutPath = path.join(__dirname, "../src/data/starMessages.ts");
const encOutPath = path.join(__dirname, "../src/data/alumni_encrypted.ts");

const foundersProfileMap = {
  "黄湘林": { fixedID: "YC-ALUM-hxl", university: "华南理工大学", major: "计算机科学与技术", city: "广州" },
  "左佳维": { fixedID: "YC-ALUM-zjw", university: "江西科技师范大学", major: "动画", city: "南昌" },
  "张正朋": { fixedID: "YC-ALUM-zzp", university: "海南大学", major: "应用物理学", city: "海口" },
  "吴桐": { fixedID: "YC-ALUM-wt", university: "香港树仁大学", major: "中文系", city: "香港" },
  "杨菁": { fixedID: "YC-ALUM-yj", university: "广东海洋大学", major: "动物科学", city: "湛江" },
  "赖盈燕": { fixedID: "YC-ALUM-lyy", university: "广州华商学院", major: "行政管理", city: "广州" },
  "朱国震": { fixedID: "YC-ALUM-zgz", university: "深圳技术大学", major: "智能感知", city: "深圳" },
  "张一鸣": { fixedID: "YC-ALUM-zym", university: "齐齐哈尔医学院", major: "医学影像", city: "齐齐哈尔" },
};

function escapeCsvValue(value) {
  const normalized = String(value ?? "");
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function pickValue(row, aliases) {
  for (const alias of aliases) {
    const maybe = row[alias];
    if (typeof maybe === "string" && maybe.trim()) {
      return maybe.trim();
    }
  }
  return "";
}

function mask(name) {
  if (!name) return "";
  if (name.length <= 1) return name;
  if (name.length === 2) return `${name[0]}*`;
  return `${name[0]}${"*".repeat(name.length - 2)}${name[name.length - 1]}`;
}

function buildEncryptedModule(base64Data) {
  return `export type AlumniRecord = {
  name: string;
  className: string;
  fixedID: string;
  message: string;
  university: string;
  major: string;
  city: string;
};

export const ALUMNI_ENCRYPTED_B64 = "${base64Data}";

function decodeBase64Utf8(base64Text: string): string {
  const maybeBuffer = (globalThis as unknown as {
    Buffer?: { from: (input: string, encoding: string) => { toString: (encoding: string) => string } };
  }).Buffer;

  if (maybeBuffer) {
    return maybeBuffer.from(base64Text, "base64").toString("utf-8");
  }

  if (typeof globalThis.atob !== "function") {
    throw new Error("No base64 decoder available in current runtime");
  }

  const binary = globalThis.atob(base64Text);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function decodeAlumniList(): AlumniRecord[] {
  const jsonText = decodeBase64Utf8(ALUMNI_ENCRYPTED_B64);
  return JSON.parse(jsonText) as AlumniRecord[];
}
`;
}

let sourceBackup = [];
try {
  sourceBackup = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
} catch {
  sourceBackup = [];
}

const sourceByName = new Map(
  sourceBackup
    .filter((row) => row && typeof row === "object" && typeof row.name === "string")
    .map((row) => [row.name.trim(), row])
);

let csvContent = "";
try {
  csvContent = fs.readFileSync(csvPath, "utf8");
} catch {
  console.log("Could not find alumni_roster.csv. Generating a mock CSV from source_alumni.json.");
  const lines = ["name,class,message,university,major,city"];

  for (const row of sourceBackup) {
    lines.push(
      [
        escapeCsvValue(row.name || ""),
        escapeCsvValue(row.className || ""),
        escapeCsvValue(row.message || ""),
        escapeCsvValue(row.university || ""),
        escapeCsvValue(row.major || ""),
        escapeCsvValue(row.city || ""),
      ].join(",")
    );
  }

  lines.push("测试人员一,高一,Bad,演示大学,演示专业,演示城市");
  lines.push("测试人员二,23级,Bad,演示大学,演示专业,演示城市");
  csvContent = lines.join("\n");
  fs.writeFileSync(csvPath, csvContent, "utf8");
}

const rawLines = csvContent
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

if (rawLines.length === 0) {
  throw new Error("CSV is empty, cannot rebuild roster.");
}

const headers = parseCsvLine(rawLines[0]);
const csvRows = rawLines.slice(1).map((line) => {
  const cols = parseCsvLine(line);
  const row = {};
  for (let i = 0; i < headers.length; i += 1) {
    row[headers[i]] = cols[i] ?? "";
  }
  return row;
});

const data = csvRows
  .map((row) => {
    const name = pickValue(row, ["name", "姓名"]);
    const className = pickValue(row, ["class", "className", "班级"]);
    if (!name || !className) {
      return null;
    }

    const backup = sourceByName.get(name) || {};
    const founder = foundersProfileMap[name] || null;

    return {
      name,
      className,
      message: pickValue(row, ["message", "寄语"]) || backup.message || "",
      university: pickValue(row, ["university", "college", "大学"]) || backup.university || (founder ? founder.university : ""),
      major: pickValue(row, ["major", "专业"]) || backup.major || (founder ? founder.major : ""),
      city: pickValue(row, ["city", "城市"]) || backup.city || (founder ? founder.city : ""),
    };
  })
  .filter(Boolean);

const targetKeywords = ["2022级", "2025届", "高三"];
const excludeKeywords = ["高一", "高二", "23级", "24级"];

const filtered = data.filter((row) => {
  const cls = row.className;
  if (excludeKeywords.some((keyword) => cls.includes(keyword))) {
    return false;
  }
  return targetKeywords.some((keyword) => cls.includes(keyword));
});

function preferValue(oldValue, newValue) {
  const oldText = typeof oldValue === "string" ? oldValue.trim() : "";
  const newText = typeof newValue === "string" ? newValue.trim() : "";
  return oldText || newText;
}

const uniqueMap = new Map();
for (const row of filtered) {
  const existing = uniqueMap.get(row.name);
  if (!existing) {
    uniqueMap.set(row.name, row);
    continue;
  }

  uniqueMap.set(row.name, {
    name: row.name,
    className: preferValue(existing.className, row.className),
    message: preferValue(existing.message, row.message),
    university: preferValue(existing.university, row.university),
    major: preferValue(existing.major, row.major),
    city: preferValue(existing.city, row.city),
  });
}

const unique = Array.from(uniqueMap.values());

const foundersList = [];
const regularList = [];

for (const row of unique) {
  const founder = foundersProfileMap[row.name];
  if (founder) {
    foundersList.push({
      name: row.name,
      className: row.className,
      fixedID: founder.fixedID,
      message: row.message,
      university: row.university || founder.university,
      major: row.major || founder.major,
      city: row.city || founder.city,
    });
  } else {
    regularList.push(row);
  }
}

regularList.sort((a, b) => a.className.localeCompare(b.className) || a.name.localeCompare(b.name));

const regularWithId = regularList.map((row, index) => {
  const serial = String(index + 1).padStart(4, "0");
  return {
    name: row.name,
    className: row.className,
    fixedID: `YC-ALUM-${serial}`,
    message: row.message || "",
    university: row.university || "",
    major: row.major || "",
    city: row.city || "",
  };
});

const finalAlumni = [...foundersList, ...regularWithId].map((row) => ({
  name: row.name,
  className: row.className,
  fixedID: row.fixedID,
  message: row.message || "",
  university: row.university || "",
  major: row.major || "",
  city: row.city || "",
}));

fs.writeFileSync(sourcePath, JSON.stringify(finalAlumni, null, 2), "utf8");

const starMsgs = finalAlumni.map((item) => ({
  name: mask(item.name),
  message: item.message || "逐梦星辰，燕中常在",
}));
fs.writeFileSync(starOutPath, `export const starMessages = ${JSON.stringify(starMsgs, null, 2)};\n`, "utf8");

const base64Data = Buffer.from(JSON.stringify(finalAlumni)).toString("base64");
fs.writeFileSync(encOutPath, buildEncryptedModule(base64Data), "utf8");

console.log("入库总人数:", finalAlumni.length);
console.log("前10名预览:");
console.table(finalAlumni.slice(0, 10));
console.log("加密入库成功:", encOutPath);

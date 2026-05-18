const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, 'source_alumni.json');
let alumni = [];
try {
  alumni = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
} catch (e) {
  console.error("读取 source_alumni.json 失败，请确保格式正确。", e);
  process.exit(1);
}

// 1. 同步星空留言 (starMessages.ts)
function mask(n) {
  if (!n) return "";
  if (n.length <= 1) return n;
  if (n.length === 2) return n[0] + "*";
  return n[0] + "*".repeat(n.length-2) + n[n.length-1];
}

const starMsgs = alumni.map(d => ({
  name: mask(d.name),
  message: d.message || "逐梦星辰，燕中常在"
}));

const starOutPath = path.join(__dirname, '../src/data/starMessages.ts');
fs.writeFileSync(starOutPath, "export const starMessages = " + JSON.stringify(starMsgs, null, 2) + ";\n", 'utf8');

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

// 2. 同步白名单加密模块 (alumni_encrypted.ts)
const minimalAlumni = alumni.map(row => ({ 
  name: row.name, 
  className: row.className, 
  fixedID: row.fixedID,
  message: row.message || "",
  university: row.university || "",
  major: row.major || "",
  city: row.city || "",
}));

const b64Data = Buffer.from(JSON.stringify(minimalAlumni)).toString('base64');
const encOutPath = path.join(__dirname, '../src/data/alumni_encrypted.ts');
fs.writeFileSync(encOutPath, buildEncryptedModule(b64Data), 'utf8');

console.log(`✅ [母港数据同步完成] 成功将 ${alumni.length} 条校友数据更新至前端加密引擎与留言墙！`);

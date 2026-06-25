import { Resend } from "resend";

function emailConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const appUrl = process.env.APP_URL;
  if (!apiKey || !from || !appUrl) return null;
  return {
    resend: new Resend(apiKey),
    from,
    appUrl: appUrl.replace(/\/+$/, ""),
  };
}

export async function send(to: string, subject: string, html: string) {
  const config = emailConfig();
  if (!config) {
    console.error("邮件配置缺失 (RESEND_API_KEY, RESEND_FROM_EMAIL 或 APP_URL 未配置)");
    return false;
  }
  try {
    const result = await config.resend.emails.send({
      from: config.from,
      to,
      subject,
      html,
    });
    if (result.error) {
      console.error("Resend API 返回错误:", result.error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Resend API 邮件发送失败:", error);
    return false;
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const config = emailConfig();
  if (!config) return false;
  const url = `${config.appUrl}/verify-email?token=${encodeURIComponent(token)}`;
  return send(
    email,
    "验证你的燕中数字母港邮箱",
    `<p>请点击以下链接完成邮箱验证：</p><p><a href="${url}">${url}</a></p><p>链接将在 24 小时后失效。</p>`,
  );
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const config = emailConfig();
  if (!config) return false;
  const url = `${config.appUrl}/reset-password?token=${encodeURIComponent(token)}`;
  return send(
    email,
    "重置你的燕中数字母港密码",
    `<p>请点击以下链接重置密码：</p><p><a href="${url}">${url}</a></p><p>链接将在 1 小时后失效。如果不是你发起的请求，请忽略此邮件。</p>`,
  );
}

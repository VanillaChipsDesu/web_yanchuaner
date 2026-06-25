import { NextRequest, NextResponse } from "next/server";
import { readJsonBody, normalizeEmail, validEmail } from "@/lib/auth-utils";
import { send } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody<{ email?: unknown }>(req, 4096);
    const email = normalizeEmail(body.email);

    if (!validEmail(email)) {
      return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
    }

    const success = await send(
      email,
      "燕中数字母港邮件发送联调测试",
      `<p>这是一封来自燕中数字母港 (yanchuaner.cn) 的测试邮件。</p><p>如果您收到此邮件，说明 Resend 生产环境发信配置成功且验证通过！</p><p>发送时间：${new Date().toLocaleString()}</p>`
    );

    if (success) {
      return NextResponse.json({ success: true, message: `测试邮件成功发送至 ${email}` });
    } else {
      return NextResponse.json({ success: false, error: "邮件发送失败，请检查控制台错误日志以了解详细原因。" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("测试邮件发送路由异常:", error);
    return NextResponse.json({ success: false, error: error.message || "请求处理失败" }, { status: 500 });
  }
}

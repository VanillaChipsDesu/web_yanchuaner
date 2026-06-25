import prisma from "../src/lib/db";
import { faker } from "@faker-js/faker/locale/zh_CN";
import { hash } from "bcryptjs";

const GRADUATION_CLASSES = [
  "2010届", "2011届", "2012届", "2013届", "2014届",
  "2015届", "2016届", "2017届", "2018届", "2019届",
  "2020届", "2021届", "2022届", "2023届",
];
const CLASS_NAMES = ["高一(1)班", "高一(2)班", "高二(3)班", "高三(4)班", "高二(5)班"];
const ROLES = ["ALUMNI", "ALUMNI", "ALUMNI", "ALUMNI", "GUEST"];
const STATUSES = ["VERIFIED", "VERIFIED", "VERIFIED", "PENDING", "PENDING"];
const ACHIEVEMENT_CATEGORIES = ["ACADEMIC", "CAREER", "SOCIAL", "ART", "SPORT", "OTHER"];

const NEWS_CONTENTS = [
  "学校年度校友联谊大会圆满落幕，来自全国各地的数百名校友齐聚母校，共叙往日情谊，共话未来发展。活动现场，校友们纷纷表示，回到母校感慨万千，看到母校日新月异的变化，倍感欣慰与自豪。",
  "母校迎来建校六十周年庆典，各界校友汇聚一堂，为学校捐赠图书馆藏书逾万册，并设立奖学金基金，用于资助品学兼优的在校学生。典礼上，多位杰出校友代表发表演讲，分享求学与创业历程。",
  "校友会正式启动「导师计划」，邀请各行业精英校友担任在校生的人生导师，提供职业规划指导和实习资源对接。首批导师阵容包括来自科技、金融、医疗和教育领域的三十余名杰出校友。",
];

async function main() {
  console.log("🌱 开始清空并播种数据库...");

  // ----- 清空表（按外键顺序） -----
  await prisma.auditLog.deleteMany();
  await prisma.userClaimRequest.deleteMany();
  await prisma.post.deleteMany();
  await prisma.eventRegistration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.news.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.alumniCorrectionRequest.deleteMany();
  await prisma.whitelistRoster.deleteMany();
  // 删除非管理员用户
  await prisma.user.deleteMany({ where: { role: { not: "ADMIN" } } });

  console.log("  ✓ 表清空完毕");

  // ----- 生成 100 个校友账号 -----
  const passwordHash = await hash("TestPass123!", 10);
  const users: Awaited<ReturnType<typeof prisma.user.create>>[] = [];

  for (let i = 0; i < 100; i++) {
    const isLongName = i < 5; // 前 5 个生成极长姓名用于边界测试
    const name = isLongName
      ? `超长测试姓名${faker.person.fullName()}`.substring(0, 64)
      : faker.person.firstName() + faker.person.lastName();
    const roleIdx = i % ROLES.length;
    const graduationClass = faker.helpers.arrayElement(GRADUATION_CLASSES);
    const className = faker.helpers.arrayElement(CLASS_NAMES);

    const user = await prisma.user.create({
      data: {
        username: `user_${i}_${faker.internet.username().toLowerCase().substring(0, 15)}`,
        email: `seed_user_${i}_${Date.now()}@example.com`,
        emailVerified: STATUSES[roleIdx] === "VERIFIED" ? new Date() : null,
        name,
        passwordHash,
        graduationClass,
        className,
        role: ROLES[roleIdx],
        status: STATUSES[roleIdx],
        accountStatus: "ACTIVE",
        sessionVersion: 0,
      },
    });
    users.push(user);

    // 每 10 个用户也加入白名单花名册
    if (i % 2 === 0) {
      await prisma.whitelistRoster.create({
        data: {
          name,
          graduationClass,
          className,
          email: user.email,
          tags: `city:${faker.helpers.arrayElement(["深圳", "广州", "北京", "上海", "成都"])};university:${faker.helpers.arrayElement(["清华大学", "北京大学", "中山大学", "深圳大学", "哈尔滨工业大学"])};major:${faker.helpers.arrayElement(["计算机科学", "软件工程", "电子工程", "金融学", "法学"])}`,
        },
      });
    }
  }
  console.log(`  ✓ 生成 ${users.length} 个校友账号及白名单记录`);

  // ----- 生成 50 条新闻/动态 -----
  for (let i = 0; i < 50; i++) {
    const isPast = i < 40;
    const publishedAt = isPast
      ? faker.date.past({ years: 2 })
      : faker.date.future({ years: 1 });
    const baseContent = NEWS_CONTENTS[i % NEWS_CONTENTS.length];
    const longContent = Array(3).fill(baseContent).join("\n\n") + "\n\n" + faker.lorem.paragraphs(4);

    await prisma.news.create({
      data: {
        title: `${faker.helpers.arrayElement(["校友会动态 | ", "母校新闻 | ", "活动通知 | ", ""])}${faker.lorem.sentence(8).substring(0, 60)}`,
        summary: faker.lorem.sentence(20).substring(0, 150),
        content: longContent,
        imageUrl: null,
        status: isPast ? "PUBLISHED" : "DRAFT",
        publishedAt: isPast ? publishedAt : null,
      },
    });
  }
  console.log("  ✓ 生成 50 条新闻记录");

  // ----- 生成 5 个活动 -----
  for (let i = 0; i < 5; i++) {
    await prisma.event.create({
      data: {
        title: `${faker.helpers.arrayElement(["年度校友联谊会", "线下沙龙", "行业交流分享会", "母校参观日", "校友论坛"])} - ${2024 + i}年`,
        summary: faker.lorem.sentence(15),
        content: Array(2).fill(faker.lorem.paragraph(5)).join("\n\n"),
        location: `深圳市${faker.helpers.arrayElement(["南山区", "福田区", "宝安区"])}某大厦`,
        eventDate: faker.date.soon({ days: 90 + i * 30 }),
        maxAttendees: faker.helpers.arrayElement([50, 100, 200, null]),
        status: "PUBLISHED",
      },
    });
  }
  console.log("  ✓ 生成 5 个活动记录");

  // ----- 生成 20 条校友成就 -----
  for (let i = 0; i < 20; i++) {
    const user = users[i % users.length];
    const longDescription =
      faker.lorem.paragraph(3) +
      "\n\n" +
      faker.lorem.paragraph(4) +
      "\n\n这项成就不仅代表了个人的努力与坚持，更体现了燕中校友在各自领域不断突破自我、追求卓越的精神风貌。学校和校友会对此深感自豪。\n\n" +
      faker.lorem.paragraph(2);

    await prisma.achievement.create({
      data: {
        alumniName: user.name ?? faker.person.fullName(),
        graduationClass: user.graduationClass ?? faker.helpers.arrayElement(GRADUATION_CLASSES),
        title: faker.helpers.arrayElement([
          "国家科技进步奖获得者",
          "Forbes 30 Under 30 入选者",
          "全国优秀教师称号获得者",
          "顶尖学术期刊 Nature 发表论文",
          "创业项目完成亿元级融资",
          "奥运会项目金牌得主",
          "全国技能竞赛冠军",
          "省级劳动模范",
        ]),
        category: ACHIEVEMENT_CATEGORIES[i % ACHIEVEMENT_CATEGORIES.length],
        description: longDescription,
        organization: faker.helpers.arrayElement([
          "国家科学技术部",
          "中国科学院",
          "腾讯科技有限公司",
          "哈佛大学",
          "深圳市政府",
          null,
        ]),
        yearLabel: `${2015 + (i % 10)}年`,
        status: "PUBLISHED",
        sortOrder: i,
      },
    });
  }
  console.log("  ✓ 生成 20 条校友成就记录");

  // ----- 生成 20 条帖子 -----
  for (let i = 0; i < 20; i++) {
    const author = users[i % users.length];
    await prisma.post.create({
      data: {
        title: faker.lorem.sentence(10).substring(0, 100),
        content: faker.lorem.paragraphs(3),
        type: faker.helpers.arrayElement(["STORY", "EVENT", "JOB"]),
        status: faker.helpers.arrayElement(["PUBLISHED", "PENDING", "REJECTED"]),
        authorId: author.id,
      },
    });
  }
  console.log("  ✓ 生成 20 条帖子记录");

  console.log("\n🎉 数据库播种完毕！");
}

main()
  .catch((e) => {
    console.error("❌ 播种失败:", e);
    process.exit(1);
  });

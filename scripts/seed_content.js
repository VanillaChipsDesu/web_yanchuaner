// Seed script: populate initial news & events for the site
// Run: node scripts/seed_content.js
const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const path = require("path");

const dbPath = path.resolve(__dirname, "..", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log("Seeding news & events...");

  // Clear existing
  await prisma.news.deleteMany();
  await prisma.eventRegistration.deleteMany();
  await prisma.event.deleteMany();

  // News
  const newsItems = [
    {
      title: "燕中校友数字母港正式上线",
      summary: "经过数月筹备，燕川中学校友数字平台今日正式对校友开放。",
      content: `经过数月筹备与内测，深圳市燕川中学校友数字母港今天正式对全体校友开放。

本平台由校友自发建设，定位为个人公益性质，致力于连接毕业校友、在校学生与教师，打造温暖的燕中数字社区。

平台目前提供以下功能：
- **星空通讯录**：校友信息查询与联系线索
- **专属纪念卡**：数字纪念卡生成
- **燕中故事**：校友故事分享专栏
- **燕中记忆**：校园文化长廊

更多功能正在开发中，敬请期待。`,
      imageUrl: null,
      status: "PUBLISHED",
      publishedAt: new Date("2026-04-20"),
    },
    {
      title: "燕川中学2022级校友数据收集启动",
      summary: "欢迎各位校友登记个人信息，方便母校长期联络和校友活动的开展。",
      content: `为了建立完整的校友数据库，方便母校长期联络和开展校友活动，现启动2022级校友信息收集工作。

登记内容：姓名、班级、就读大学、专业方向、所在城市。

通过本平台的"加入星港"功能提交申请，审核通过后即可入库。

所有信息仅用于校友联络与情感连接，不作商业用途。`,
      imageUrl: null,
      status: "PUBLISHED",
      publishedAt: new Date("2026-04-25"),
    },
    {
      title: "平台共建者招募 — 一起为母校出力",
      summary: "欢迎有技术、内容、设计能力的校友加入共建团队。",
      content: `燕中校友数字母港是一个由校友自发建设的公益平台。我们欢迎具有以下能力的校友加入共建：

技术方向：前端开发（React/Next.js）、后端开发（Node.js/Prisma）、服务器运维（Linux/Docker）
内容方向：文字编辑与故事撰写、视觉设计与图片处理、社交媒体运营
运营方向：校友联络与信息维护、活动策划与组织

如有兴趣，请在平台"燕中故事"板块投稿联系站长。`,
      imageUrl: null,
      status: "PUBLISHED",
      publishedAt: new Date("2026-04-28"),
    },
  ];

  const eventsItems = [
    {
      title: "燕中校友首届线上见面会",
      summary: "欢迎各位校友在线交流，分享近况，共话未来。",
      content: "活动详情：校友自我介绍与近况分享、大学经验交流、校友会未来发展规划讨论、自由交流环节。报名后会将会议链接通过预留联系方式发送。",
      location: "线上（腾讯会议）",
      eventDate: new Date("2026-05-15T20:00:00"),
      endDate: new Date("2026-05-15T22:00:00"),
      maxAttendees: 100,
      status: "PUBLISHED",
    },
    {
      title: "2026年暑假返校活动预告",
      summary: "计划于暑期组织校友返校参观，与老师和在校生交流。",
      content: "活动预告：计划于2026年暑假期间组织首届校友返校活动。预计内容：校园参观、与恩师座谈、与在校生分享大学经验、校友聚餐。具体时间、报名方式将另行通知。",
      location: "深圳市燕川中学",
      eventDate: new Date("2026-07-15T09:00:00"),
      endDate: new Date("2026-07-15T17:00:00"),
      maxAttendees: 200,
      status: "PUBLISHED",
    },
  ];

  for (const item of newsItems) {
    await prisma.news.create({ data: item });
    console.log(`  News: ${item.title}`);
  }

  for (const item of eventsItems) {
    await prisma.event.create({ data: item });
    console.log(`  Event: ${item.title}`);
  }

  console.log(`Done! ${newsItems.length} news, ${eventsItems.length} events seeded.`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

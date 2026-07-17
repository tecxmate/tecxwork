/**
 * Yang Luck (揚運國際集團) demo seed — fictional data only, no real PII.
 *
 * Seeds one manpower-agency recruiter, its client-placement job board, ~28
 * candidate profiles, and applications spread across all 5 ATS stages so the
 * kanban board looks alive. Run against the DEMO database only:
 *
 *   DATABASE_URL="<demo>" npx tsx src/lib/db/seed-yang-luck.ts
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import bcrypt from "bcryptjs";
import * as schema from "./schema";

type Stage = "applied" | "screening" | "interview" | "offer" | "hired";

const CV = "https://drive.google.com/demo-cv-placeholder";

// ---- 7 client-placement jobs (candidate-facing board) ----
const JOBS = [
  { key: "site-eng", title: "工地工程師 Site Engineer（會 AutoCAD／BIM）", cat: "營造 Construction", loc: "台中 Taichung", lang: "中文中級＋英文", min: 38000, max: 55000 },
  { key: "site-admin", title: "工地管理助理 Site Admin Assistant", cat: "營造 Construction", loc: "台中 Taichung", lang: "中文", min: 30000, max: 38000 },
  { key: "mep", title: "機電技術員 MEP Technician", cat: "機電 MEP", loc: "新北 New Taipei", lang: "中文初級", min: 32000, max: 42000 },
  { key: "hotel", title: "飯店櫃台／房務 Hotel Front-desk / Housekeeping", cat: "旅宿 Hospitality", loc: "台北 Taipei", lang: "中文＋英文", min: 30000, max: 40000 },
  { key: "restaurant", title: "餐廳外場服務 Restaurant Service", cat: "餐飲 F&B", loc: "高雄 Kaohsiung", lang: "中文", min: 28000, max: 36000 },
  { key: "factory", title: "工廠作業員／技術員 Factory Operator", cat: "製造 Manufacturing", loc: "桃園 Taoyuan", lang: "中文初級", min: 31000, max: 40000 },
  { key: "trainee", title: "白領行政助理／儲備幹部 Admin / Management Trainee", cat: "集團/客戶 Corporate", loc: "台中 Taichung", lang: "中文流利＋英文", min: 36000, max: 48000 },
];

// ---- ~28 fictional candidates (VN / ID / PH) → job + stage ----
const C = (name: string, nameZh: string, nat: string, school: string, schoolEn: string, major: string, year: string, langs: string, skills: string[], job: string, stage: Stage, ai: number) =>
  ({ name, nameZh, nat, school, schoolEn, major, year, langs, skills, job, stage, ai });

const CANDIDATES = [
  // --- Site Engineer showcase job: 12 across all stages ---
  C("Nguyễn Thị Mai", "阮氏梅", "越南 Vietnam", "明志科技大學", "Ming Chi Univ. of Technology", "機械工程系 Mechanical Eng.", "大四 Senior", "中文中級・英文流利", ["AutoCAD", "SolidWorks"], "site-eng", "interview", 88),
  C("Lê Văn Đức", "黎文德", "越南 Vietnam", "台科大", "NTUST", "土木工程 Civil Eng.", "碩一 M1", "中文流利・英文中級", ["AutoCAD", "BIM", "Revit"], "site-eng", "offer", 91),
  C("Trần Quốc Bảo", "陳國寶", "越南 Vietnam", "龍華科技大學", "Lunghwa Univ.", "土木 Civil", "大四 Senior", "中文中級", ["AutoCAD"], "site-eng", "applied", 74),
  C("Phạm Gia Hân", "范嘉欣", "越南 Vietnam", "健行科技大學", "Chien Hsin Univ.", "營建工程 Construction", "大三 Junior", "中文中級・英文初級", ["AutoCAD", "Excel"], "site-eng", "screening", 79),
  C("Putri Ayu", "普特麗", "印尼 Indonesia", "清雲科技大學", "Ching Yun Univ.", "土木 Civil", "大四 Senior", "中文中級", ["AutoCAD", "BIM"], "site-eng", "screening", 82),
  C("Hoàng Minh Tuấn", "黃明俊", "越南 Vietnam", "明志科技大學", "Ming Chi Univ. of Technology", "機械 Mechanical", "碩二 M2", "中文流利・英文流利", ["BIM", "Revit", "Navisworks"], "site-eng", "interview", 90),
  C("Đặng Thùy Linh", "鄧垂玲", "越南 Vietnam", "台科大", "NTUST", "營建 Construction Mgmt", "大四 Senior", "中文中級・英文中級", ["AutoCAD", "MS Project"], "site-eng", "applied", 71),
  C("Rizky Pratama", "里茲基", "印尼 Indonesia", "龍華科技大學", "Lunghwa Univ.", "土木 Civil", "大三 Junior", "中文初級・英文中級", ["AutoCAD"], "site-eng", "applied", 68),
  C("Vũ Đình Nam", "武廷南", "越南 Vietnam", "健行科技大學", "Chien Hsin Univ.", "土木 Civil", "大四 Senior", "中文中級", ["AutoCAD", "BIM"], "site-eng", "interview", 85),
  C("Maria Santos", "瑪莉亞", "菲律賓 Philippines", "台科大", "NTUST", "結構工程 Structural", "碩一 M1", "中文初級・英文流利", ["BIM", "ETABS"], "site-eng", "hired", 93),
  C("Bùi Thanh Sơn", "裴清山", "越南 Vietnam", "明志科技大學", "Ming Chi Univ. of Technology", "機械 Mechanical", "大四 Senior", "中文中級", ["AutoCAD", "SolidWorks"], "site-eng", "screening", 77),
  C("Agus Santoso", "阿古斯", "印尼 Indonesia", "清雲科技大學", "Ching Yun Univ.", "營建 Construction", "大四 Senior", "中文中級", ["AutoCAD"], "site-eng", "offer", 84),

  // --- MEP Technician: 4 ---
  C("Putra Wijaya", "普特拉", "印尼 Indonesia", "龍華科技大學", "Lunghwa Univ.", "電機系 Electrical Eng.", "大三 Junior", "中文初級", ["PLC", "電路 Circuits"], "mep", "screening", 76),
  C("Ngô Bá Khá", "吳霸科", "越南 Vietnam", "健行科技大學", "Chien Hsin Univ.", "電機 Electrical", "大四 Senior", "中文中級", ["配電 Wiring", "PLC"], "mep", "applied", 70),
  C("Sari Dewi", "莎麗", "印尼 Indonesia", "龍華科技大學", "Lunghwa Univ.", "電子 Electronics", "大四 Senior", "中文初級・英文中級", ["電路 Circuits"], "mep", "interview", 81),
  C("Lý Hồng Phúc", "李鴻福", "越南 Vietnam", "清雲科技大學", "Ching Yun Univ.", "電機 Electrical", "碩一 M1", "中文中級", ["PLC", "自動化 Automation"], "mep", "offer", 86),

  // --- Hotel: 3 ---
  C("Trần Văn Quý", "陳文貴", "越南 Vietnam", "高雄餐旅大學", "NKUHT", "餐旅系 Hospitality", "大四 Senior", "中文流利・英文中級", ["接待 Reception", "訂房 PMS"], "hotel", "offer", 87),
  C("Nguyễn Ngọc Anh", "阮玉英", "越南 Vietnam", "高雄餐旅大學", "NKUHT", "旅館 Hotel Mgmt", "大三 Junior", "中文流利・英文流利", ["房務 Housekeeping"], "hotel", "interview", 83),
  C("Intan Permata", "英丹", "印尼 Indonesia", "弘光科技大學", "HK Univ.", "觀光 Tourism", "大四 Senior", "中文中級・英文中級", ["接待 Reception"], "hotel", "applied", 72),

  // --- Restaurant: 3 ---
  C("Dewi Lestari", "黛薇", "印尼 Indonesia", "弘光科技大學", "HK Univ.", "餐飲管理 F&B Mgmt", "大三 Junior", "中文中級", ["外場 Service"], "restaurant", "applied", 69),
  C("Phan Thị Hằng", "潘氏姮", "越南 Vietnam", "高雄餐旅大學", "NKUHT", "餐飲 Culinary", "大四 Senior", "中文流利", ["外場 Service", "點餐 POS"], "restaurant", "screening", 75),
  C("Joko Susilo", "佐科", "印尼 Indonesia", "弘光科技大學", "HK Univ.", "餐飲 F&B", "大四 Senior", "中文中級", ["外場 Service"], "restaurant", "hired", 80),

  // --- Factory: 3 ---
  C("Lê Thị Thu", "黎氏秋", "越南 Vietnam", "明志科技大學", "Ming Chi Univ. of Technology", "機械 Mechanical", "大四 Senior", "中文初級", ["CNC", "品管 QC"], "factory", "applied", 67),
  C("Andi Kurniawan", "安迪", "印尼 Indonesia", "龍華科技大學", "Lunghwa Univ.", "機械 Mechanical", "大三 Junior", "中文初級", ["CNC"], "factory", "screening", 73),
  C("Đỗ Mạnh Cường", "杜孟強", "越南 Vietnam", "健行科技大學", "Chien Hsin Univ.", "機械 Mechanical", "大四 Senior", "中文中級", ["CNC", "品管 QC"], "factory", "interview", 82),

  // --- Site Admin: 2 ---
  C("Vương Tuấn Kiệt", "王俊傑", "越南 Vietnam", "健行科技大學", "Chien Hsin Univ.", "商業管理 Business", "大四 Senior", "中文流利", ["Excel", "文書 Admin"], "site-admin", "applied", 70),
  C("Siti Nurhaliza", "西蒂", "印尼 Indonesia", "清雲科技大學", "Ching Yun Univ.", "商管 Business", "大三 Junior", "中文中級", ["Excel"], "site-admin", "screening", 74),

  // --- Trainee: 3 (incl. anchor at hired) ---
  C("Lê Minh Hoàng", "黎明煌", "越南 Vietnam", "台科大", "NTUST", "土木工程 Civil Eng.", "碩一 M1", "中文流利・英文流利", ["BIM", "領導 Leadership"], "trainee", "hired", 95),
  C("Kevin Tanaka", "陳凱文", "菲律賓 Philippines", "台科大", "NTUST", "資訊工程 CS", "大四 Senior", "中文中級・英文流利", ["Python", "SQL"], "trainee", "interview", 89),
  C("Trịnh Thu Trang", "鄭秋莊", "越南 Vietnam", "健行科技大學", "Chien Hsin Univ.", "商業管理 Business", "大四 Senior", "中文流利・英文中級", ["Excel", "簡報 Presentation"], "trainee", "offer", 85),
];

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  // Safety: refuse to seed the live production DB by mistake.
  if (url.includes("delicate-lab") || url.includes("bitter-hill")) {
    throw new Error("Refusing to seed: DATABASE_URL points at a PROD host. Use the demo DB.");
  }
  const db = drizzle(neon(url), { schema });

  console.log("Resetting demo data…");
  // FK-safe delete order (demo DB only).
  await db.delete(schema.applications);
  await db.delete(schema.bookings);
  await db.delete(schema.slots);
  await db.delete(schema.jobOpenings);
  await db.delete(schema.applicantProfiles);
  await db.delete(schema.recruiters);
  await db.delete(schema.eventConfig);
  await db.delete(schema.users);

  // Demo logins
  const recruiterPw = await bcrypt.hash("demo1234", 12);
  const adminPw = await bcrypt.hash("demo1234", 12);
  await db.insert(schema.users).values({ email: "admin@yangluck.demo", name: "Demo Admin", passwordHash: adminPw, role: "admin" });
  const [recUser] = await db.insert(schema.users)
    .values({ email: "hr@yangluck.demo", name: "揚運 HR 陳小姐", passwordHash: recruiterPw, role: "recruiter" })
    .returning();

  const [rec] = await db.insert(schema.recruiters).values({
    userId: recUser.id,
    company: "揚運國際集團 Yang Luck",
    industry: "人力仲介 Manpower Agency",
    description: "揚運國際集團 — 台中總部的國際人力仲介與派遣集團，為營造、製造、旅宿業客戶媒合學生與白領人才。",
    contactEmail: "hr@yangluck.demo",
    positions: JOBS.map((j) => j.title),
    interviewerCount: 3,
  }).returning();

  // Jobs
  const jobIdByKey: Record<string, number> = {};
  for (const j of JOBS) {
    const [row] = await db.insert(schema.jobOpenings).values({
      recruiterId: rec.id,
      title: j.title,
      jobCategory: j.cat,
      location: j.loc,
      employmentType: "full_time",
      workplaceType: "onsite",
      salaryMin: j.min,
      salaryMax: j.max,
      salaryCurrency: "TWD",
      salaryPeriod: "month",
      seniority: "entry_level",
      languageRequirement: j.lang,
      visaSupport: "case_by_case",
      description: `${j.title}｜揚運為客戶企業媒合之職缺。`,
      requirements: "相關科系在學或應屆畢業；具備基本溝通能力。",
      moderationStatus: "approved",
      reviewedAt: new Date(),
    }).returning();
    jobIdByKey[j.key] = row.id;
  }

  // Candidates + applications
  let n = 0;
  for (const c of CANDIDATES) {
    const email = `cand${n + 1}@yangluck.demo`;
    const [appl] = await db.insert(schema.applicantProfiles).values({
      name: `${c.name}（${c.nameZh}）`,
      email,
      nationality: c.nat,
      schoolName: c.school,
      schoolNameEn: c.schoolEn,
      major: c.major,
      studyLevel: c.year,
      skills: c.skills,
      cvLink: CV,
      description: `${c.major}・${c.year}・${c.langs}`,
      pipaConsent: true,
    }).returning();

    await db.insert(schema.applications).values({
      jobOpeningId: jobIdByKey[c.job],
      applicantId: appl.id,
      recruiterId: rec.id,
      stage: c.stage,
      notes: "",
      aiScore: c.ai,
    });
    n++;
  }

  // Branded event config (demo homepage title)
  await db.insert(schema.eventConfig).values({
    eventName: "揚運 Yang Luck 人才媒合平台",
    eventDate: new Date("2026-08-01T09:00:00+08:00"),
    hostedAt: "揚運國際集團",
    location: "台中 Taichung",
    slotDurationMinutes: 30,
    salaryCurrencyOptions: ["TWD", "VND", "USD"],
  });

  const stages = CANDIDATES.reduce((m, c) => ((m[c.stage] = (m[c.stage] || 0) + 1), m), {} as Record<string, number>);
  console.log(`Seeded: 1 recruiter, ${JOBS.length} jobs, ${CANDIDATES.length} candidates/applications`);
  console.log("Stage spread:", stages);
  console.log("Showcase job 'Site Engineer' applicants:", CANDIDATES.filter((c) => c.job === "site-eng").length);
  console.log("Recruiter login: hr@yangluck.demo / demo1234");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

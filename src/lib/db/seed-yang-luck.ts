/**
 * Yang Luck (揚運國際集團) demo seed — fictional candidates only, no real PII.
 *
 * Agency model: Yang Luck is the single platform recruiter. Its open positions
 * are tagged with the real CLIENT COMPANY it places for — 6 confirmed group
 * subsidiaries (from yangluck.com.tw "集團夥伴") + real central-Taiwan companies
 * in the sectors it serves (representative clients; agencies don't publish client
 * lists). Positions are the white-collar / student roles the platform actually
 * places (NOT the blue-collar migrant roles those firms also hire for).
 *
 * Run against the DEMO database only:
 *   DATABASE_URL="<demo>" npx tsx src/lib/db/seed-yang-luck.ts
 */
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import * as schema from "./schema";

/** Neon speaks HTTP to Neon's proxy; a local Postgres speaks the plain wire protocol.
 *  Same URL-based switch as src/lib/db, so the demo world can be seeded locally too. */
function connect(url: string) {
  const host = new URL(url).hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1";
  return isLocal
    ? drizzlePg(new Pool({ connectionString: url }), { schema })
    : drizzleNeon(neon(url), { schema });
}

type Stage = "applied" | "screening" | "interview" | "offer" | "hired";
type Kind = "subsidiary" | "client";
interface Pos { zh: string; en: string; lang: string }
interface Company {
  key: string; // stable id for candidate assignment
  zh: string;
  en: string;
  industry: string;
  kind: Kind;
  positions: Pos[]; // position[0] is the primary white-collar role
}

const CV = "https://drive.google.com/demo-cv-placeholder";

// Salary band (TWD/month) by industry keyword.
function salary(industry: string): [number, number] {
  if (industry.includes("營造")) return [34000, 50000];
  if (industry.includes("機電")) return [34000, 46000];
  if (industry.includes("製造")) return [33000, 48000];
  if (industry.includes("旅宿")) return [31000, 42000];
  if (industry.includes("派遣")) return [34000, 46000];
  if (industry.includes("農")) return [30000, 38000];
  return [32000, 44000];
}

// 25 companies: 6 confirmed subsidiaries + 19 representative real client firms.
const COMPANIES: Company[] = [
  // --- Confirmed Yang Luck group subsidiaries (yangluck.com.tw) ---
  { key: "yanghong", zh: "揚宏營造", en: "Yang Hong Construction", industry: "營造 Construction", kind: "subsidiary",
    positions: [{ zh: "工地工程師（會 AutoCAD）", en: "Site Engineer", lang: "中文中級＋英文" }, { zh: "工務行政助理", en: "Site Admin Assistant", lang: "中文" }] },
  { key: "ylmep", zh: "揚運機電", en: "Yang Luck MEP", industry: "機電 MEP", kind: "subsidiary",
    positions: [{ zh: "機電助理工程師", en: "MEP Assistant Engineer", lang: "中文中級" }] },
  { key: "changlong", zh: "長隆人力資源", en: "Changlong HR", industry: "人力派遣 Staffing", kind: "subsidiary",
    positions: [{ zh: "招募專員", en: "Recruitment Specialist", lang: "中文流利＋英文" }, { zh: "移工管理專員", en: "Migrant Worker Coordinator", lang: "中文中級＋越南文/印尼文" }] },
  { key: "qingyuan", zh: "慶圓開發", en: "Qingyuan Development", industry: "營造 Construction", kind: "subsidiary",
    positions: [{ zh: "開發專案助理", en: "Development Project Assistant", lang: "中文中級" }] },
  { key: "dahu", zh: "揚運大湖農莊", en: "Yang Luck Dahu Farm", industry: "農業 Agriculture", kind: "subsidiary",
    positions: [{ zh: "農場管理儲備幹部", en: "Farm Management Trainee", lang: "中文中級" }] },
  { key: "macau", zh: "澳門欣榮人力", en: "Macau Xinrong Manpower", industry: "人力派遣 Staffing", kind: "subsidiary",
    positions: [{ zh: "跨境人力招募專員", en: "Cross-border Recruiter", lang: "中文流利＋英文" }] },

  // --- 營造 Construction / developers (representative) ---
  { key: "leeming", zh: "麗明營造", en: "Lee Ming Construction", industry: "營造 Construction", kind: "client",
    positions: [{ zh: "工地工程師（會 AutoCAD／BIM）", en: "Site Engineer (AutoCAD/BIM)", lang: "中文中級＋英文" }, { zh: "工地管理助理", en: "Site Management Assistant", lang: "中文" }] },
  { key: "ruizhu", zh: "瑞助營造", en: "Rui Zhu Construction", industry: "營造 Construction", kind: "client",
    positions: [{ zh: "工地工程師", en: "Site Engineer", lang: "中文中級" }, { zh: "工地安全衛生助理", en: "Site Safety Assistant", lang: "中文中級" }] },
  { key: "chengzhongheng", zh: "成中恒營造", en: "Cheng Chung Heng Construction", industry: "營造 Construction", kind: "client",
    positions: [{ zh: "工程物料管理員", en: "Materials Coordinator", lang: "中文中級" }] },
  { key: "chiafu", zh: "嘉福營造", en: "Chia Fu Construction", industry: "營造 Construction", kind: "client",
    positions: [{ zh: "工地測量助理", en: "Survey Assistant", lang: "中文中級" }] },
  { key: "lianju", zh: "聯聚建設", en: "Lianju Development", industry: "營造 Construction", kind: "client",
    positions: [{ zh: "建案工務助理", en: "Project Works Assistant", lang: "中文中級" }] },
  { key: "luft", zh: "陸府建設", en: "Luft Development", industry: "營造 Construction", kind: "client",
    positions: [{ zh: "建案行政助理", en: "Project Admin Assistant", lang: "中文中級" }] },

  // --- 製造 Manufacturing (representative) ---
  { key: "giant", zh: "巨大機械（捷安特）", en: "Giant Manufacturing", industry: "製造 Manufacturing", kind: "client",
    positions: [{ zh: "製程工程師（儲備）", en: "Process Engineer (Trainee)", lang: "中文中級" }, { zh: "品管工程師", en: "QC Engineer", lang: "中文中級" }] },
  { key: "hiwin", zh: "上銀科技", en: "HIWIN Technologies", industry: "製造 Manufacturing", kind: "client",
    positions: [{ zh: "自動化工程師（儲備）", en: "Automation Engineer (Trainee)", lang: "中文中級＋英文" }, { zh: "製程技術員", en: "Process Technician", lang: "中文中級" }] },
  { key: "victor", zh: "台中精機", en: "Victor Taichung Machinery", industry: "製造 Manufacturing", kind: "client",
    positions: [{ zh: "機械設計助理工程師", en: "Mechanical Design Assistant", lang: "中文中級" }] },
  { key: "fairfriend", zh: "友嘉實業", en: "Fair Friend Enterprise", industry: "製造 Manufacturing", kind: "client",
    positions: [{ zh: "生產管理儲備幹部", en: "Production Management Trainee", lang: "中文流利＋英文" }] },
  { key: "chengshin", zh: "正新橡膠（瑪吉斯）", en: "Cheng Shin Rubber (Maxxis)", industry: "製造 Manufacturing", kind: "client",
    positions: [{ zh: "製程工程師", en: "Process Engineer", lang: "中文中級" }] },
  { key: "kenda", zh: "建大工業", en: "Kenda Rubber", industry: "製造 Manufacturing", kind: "client",
    positions: [{ zh: "品保工程師", en: "Quality Assurance Engineer", lang: "中文中級" }] },
  { key: "largan", zh: "大立光電", en: "Largan Precision", industry: "製造 Manufacturing", kind: "client",
    positions: [{ zh: "光學製程工程師（儲備）", en: "Optical Process Engineer (Trainee)", lang: "中文中級＋英文" }, { zh: "設備工程師", en: "Equipment Engineer", lang: "中文中級" }] },
  { key: "superalloy", zh: "巧新科技", en: "Superalloy Industrial", industry: "製造 Manufacturing", kind: "client",
    positions: [{ zh: "製造工程師（儲備）", en: "Manufacturing Engineer (Trainee)", lang: "中文中級" }] },

  // --- 旅宿 Hospitality (representative) ---
  { key: "windsor", zh: "台中裕元花園酒店", en: "Windsor Hotel Taichung", industry: "旅宿 Hospitality", kind: "client",
    positions: [{ zh: "櫃檯接待（中英）", en: "Front Desk (CN/EN)", lang: "中文流利＋英文" }, { zh: "餐飲儲備幹部", en: "F&B Management Trainee", lang: "中文中級" }] },
  { key: "linhotel", zh: "台中林酒店", en: "The Lin Hotel Taichung", industry: "旅宿 Hospitality", kind: "client",
    positions: [{ zh: "櫃檯接待（中英）", en: "Front Desk Receptionist", lang: "中文流利＋英文" }, { zh: "宴會服務儲備", en: "Banquet Service Trainee", lang: "中文中級" }] },
  { key: "millennium", zh: "台中日月千禧酒店", en: "Millennium Hotel Taichung", industry: "旅宿 Hospitality", kind: "client",
    positions: [{ zh: "旅館管理儲備幹部", en: "Hotel Management Trainee", lang: "中文流利＋英文" }] },
  { key: "freshfields", zh: "清新溫泉飯店", en: "Freshfields Resort", industry: "旅宿 Hospitality", kind: "client",
    positions: [{ zh: "客務儲備幹部", en: "Guest Services Trainee", lang: "中文中級＋英文" }, { zh: "餐廳外場服務", en: "Restaurant Service", lang: "中文中級" }] },
  { key: "evergreen", zh: "台中長榮桂冠酒店", en: "Evergreen Laurel Hotel", industry: "旅宿 Hospitality", kind: "client",
    positions: [{ zh: "櫃檯接待", en: "Front Office Agent", lang: "中文流利＋英文" }] },
];

// Candidate personas → assigned to a company (its primary position) + stage.
const C = (name: string, nameZh: string, nat: string, school: string, schoolEn: string, major: string, year: string, langs: string, skills: string[], company: string, stage: Stage, ai: number, posIndex = 0) =>
  ({ name, nameZh, nat, school, schoolEn, major, year, langs, skills, company, stage, ai, posIndex });

const CANDIDATES = [
  // --- Showcase: 麗明營造 Site Engineer — 12 across all stages ---
  C("Nguyễn Thị Mai", "阮氏梅", "越南 Vietnam", "明志科技大學", "Ming Chi Univ.", "機械工程 Mechanical Eng.", "大四 Senior", "中文中級・英文流利", ["AutoCAD", "SolidWorks"], "leeming", "interview", 88),
  C("Lê Văn Đức", "黎文德", "越南 Vietnam", "台科大", "NTUST", "土木工程 Civil Eng.", "碩一 M1", "中文流利・英文中級", ["AutoCAD", "BIM", "Revit"], "leeming", "offer", 91),
  C("Trần Quốc Bảo", "陳國寶", "越南 Vietnam", "龍華科技大學", "Lunghwa Univ.", "土木 Civil", "大四 Senior", "中文中級", ["AutoCAD"], "leeming", "applied", 74),
  C("Phạm Gia Hân", "范嘉欣", "越南 Vietnam", "健行科技大學", "Chien Hsin Univ.", "營建工程 Construction", "大三 Junior", "中文中級・英文初級", ["AutoCAD", "Excel"], "leeming", "screening", 79),
  C("Putri Ayu", "普特麗", "印尼 Indonesia", "清雲科技大學", "Ching Yun Univ.", "土木 Civil", "大四 Senior", "中文中級", ["AutoCAD", "BIM"], "leeming", "screening", 82),
  C("Hoàng Minh Tuấn", "黃明俊", "越南 Vietnam", "明志科技大學", "Ming Chi Univ.", "機械 Mechanical", "碩二 M2", "中文流利・英文流利", ["BIM", "Revit", "Navisworks"], "leeming", "interview", 90),
  C("Đặng Thùy Linh", "鄧垂玲", "越南 Vietnam", "台科大", "NTUST", "營建 Construction Mgmt", "大四 Senior", "中文中級・英文中級", ["AutoCAD", "MS Project"], "leeming", "applied", 71),
  C("Rizky Pratama", "里茲基", "印尼 Indonesia", "龍華科技大學", "Lunghwa Univ.", "土木 Civil", "大三 Junior", "中文初級・英文中級", ["AutoCAD"], "leeming", "applied", 68),
  C("Vũ Đình Nam", "武廷南", "越南 Vietnam", "健行科技大學", "Chien Hsin Univ.", "土木 Civil", "大四 Senior", "中文中級", ["AutoCAD", "BIM"], "leeming", "interview", 85),
  C("Maria Santos", "瑪莉亞", "菲律賓 Philippines", "台科大", "NTUST", "結構工程 Structural", "碩一 M1", "中文初級・英文流利", ["BIM", "ETABS"], "leeming", "hired", 93),
  C("Bùi Thanh Sơn", "裴清山", "越南 Vietnam", "明志科技大學", "Ming Chi Univ.", "機械 Mechanical", "大四 Senior", "中文中級", ["AutoCAD", "SolidWorks"], "leeming", "screening", 77),
  C("Agus Santoso", "阿古斯", "印尼 Indonesia", "清雲科技大學", "Ching Yun Univ.", "營建 Construction", "大四 Senior", "中文中級", ["AutoCAD"], "leeming", "offer", 84),

  // --- 揚運機電 MEP (subsidiary) — 4 ---
  C("Putra Wijaya", "普特拉", "印尼 Indonesia", "龍華科技大學", "Lunghwa Univ.", "電機 Electrical Eng.", "大三 Junior", "中文初級", ["PLC", "電路 Circuits"], "ylmep", "screening", 76),
  C("Ngô Bá Khá", "吳霸科", "越南 Vietnam", "健行科技大學", "Chien Hsin Univ.", "電機 Electrical", "大四 Senior", "中文中級", ["配電 Wiring", "PLC"], "ylmep", "applied", 70),
  C("Sari Dewi", "莎麗", "印尼 Indonesia", "龍華科技大學", "Lunghwa Univ.", "電子 Electronics", "大四 Senior", "中文初級・英文中級", ["電路 Circuits"], "ylmep", "interview", 81),
  C("Lý Hồng Phúc", "李鴻福", "越南 Vietnam", "清雲科技大學", "Ching Yun Univ.", "電機 Electrical", "碩一 M1", "中文中級", ["PLC", "自動化 Automation"], "ylmep", "offer", 86),

  // --- 巨大機械 Giant (manufacturing) — 4 ---
  C("Lê Thị Thu", "黎氏秋", "越南 Vietnam", "明志科技大學", "Ming Chi Univ.", "機械 Mechanical", "大四 Senior", "中文中級", ["CNC", "品管 QC"], "giant", "applied", 72),
  C("Andi Kurniawan", "安迪", "印尼 Indonesia", "龍華科技大學", "Lunghwa Univ.", "機械 Mechanical", "大三 Junior", "中文初級", ["CNC"], "giant", "screening", 73),
  C("Đỗ Mạnh Cường", "杜孟強", "越南 Vietnam", "健行科技大學", "Chien Hsin Univ.", "機械 Mechanical", "大四 Senior", "中文中級", ["CNC", "品管 QC"], "giant", "interview", 82),
  C("Bùi Thị Ngọc", "裴氏玉", "越南 Vietnam", "虎尾科技大學", "NFU", "工業工程 IE", "大四 Senior", "中文中級", ["品管 QC", "Excel"], "giant", "offer", 80),

  // --- 上銀 HIWIN (manufacturing) — 3 ---
  C("Trần Đại Nghĩa", "陳大義", "越南 Vietnam", "台科大", "NTUST", "機械 Mechanical", "碩一 M1", "中文中級・英文流利", ["自動化 Automation", "PLC"], "hiwin", "interview", 87),
  C("Wayan Sudarsana", "瓦楊", "印尼 Indonesia", "勤益科技大學", "NCUT", "自動化 Automation", "大四 Senior", "中文中級", ["PLC", "SCADA"], "hiwin", "screening", 78),
  C("Phùng Quang Huy", "馮光輝", "越南 Vietnam", "明志科技大學", "Ming Chi Univ.", "機械 Mechanical", "大四 Senior", "中文中級", ["CNC", "SolidWorks"], "hiwin", "applied", 71),

  // --- 大立光電 Largan (manufacturing) — 2 ---
  C("Kadek Ari", "卡德", "印尼 Indonesia", "勤益科技大學", "NCUT", "光電 Photonics", "大四 Senior", "中文中級", ["無塵室 Cleanroom", "光學 Optics"], "largan", "applied", 75),
  C("Lương Thế Vinh", "梁世榮", "越南 Vietnam", "台科大", "NTUST", "光電工程 Photonics", "碩一 M1", "中文中級・英文流利", ["光學 Optics", "Matlab"], "largan", "interview", 84),

  // --- 揚宏營造 (subsidiary construction) — 2 (Site Admin) ---
  C("Vương Tuấn Kiệt", "王俊傑", "越南 Vietnam", "健行科技大學", "Chien Hsin Univ.", "商業管理 Business", "大四 Senior", "中文流利", ["Excel", "文書 Admin"], "yanghong", "applied", 70, 1),
  C("Siti Nurhaliza", "西蒂", "印尼 Indonesia", "清雲科技大學", "Ching Yun Univ.", "商管 Business", "大三 Junior", "中文中級", ["Excel"], "yanghong", "screening", 74, 1),

  // --- 長隆人力資源 (subsidiary staffing) — 2 (Coordinator, VN/ID speakers) ---
  C("Nguyễn Hải Yến", "阮海燕", "越南 Vietnam", "文藻外語大學", "Wenzao", "應用華語 Chinese", "大四 Senior", "中文流利・英文中級・越南文母語", ["翻譯 Translation", "招募"], "changlong", "interview", 83, 1),
  C("Dewi Anggraini", "黛薇", "印尼 Indonesia", "靜宜大學", "Providence Univ.", "國際企業 IB", "大四 Senior", "中文流利・印尼文母語", ["招募", "Excel"], "changlong", "offer", 85, 1),

  // --- 台中林酒店 (hotel) — 3 ---
  C("Trần Văn Quý", "陳文貴", "越南 Vietnam", "高雄餐旅大學", "NKUHT", "餐旅 Hospitality", "大四 Senior", "中文流利・英文中級", ["接待 Reception", "PMS"], "linhotel", "offer", 87),
  C("Nguyễn Ngọc Anh", "阮玉英", "越南 Vietnam", "高雄餐旅大學", "NKUHT", "旅館 Hotel Mgmt", "大三 Junior", "中文流利・英文流利", ["房務 Housekeeping"], "linhotel", "interview", 83),
  C("Intan Permata", "英丹", "印尼 Indonesia", "弘光科技大學", "HK Univ.", "觀光 Tourism", "大四 Senior", "中文中級・英文中級", ["接待 Reception"], "linhotel", "applied", 72),

  // --- 清新溫泉飯店 (hotel) — 2 ---
  C("Phan Thị Hằng", "潘氏姮", "越南 Vietnam", "高雄餐旅大學", "NKUHT", "餐飲 Culinary", "大四 Senior", "中文流利", ["外場 Service", "POS"], "freshfields", "screening", 75, 1),
  C("Joko Susilo", "佐科", "印尼 Indonesia", "弘光科技大學", "HK Univ.", "餐飲 F&B", "大四 Senior", "中文中級", ["外場 Service"], "freshfields", "hired", 80, 1),

  // --- 台中裕元花園酒店 Windsor (hotel) — 1 ---
  C("Maria Dela Cruz", "瑪利亞", "菲律賓 Philippines", "文藻外語大學", "Wenzao", "英語 English", "大四 Senior", "英文母語・中文中級", ["接待 Reception", "English"], "windsor", "interview", 86),

  // --- 友嘉實業 Fair Friend — 1 (Management Trainee) ---
  C("Kevin Tanaka", "陳凱文", "菲律賓 Philippines", "台科大", "NTUST", "資訊工程 CS", "大四 Senior", "中文中級・英文流利", ["Python", "SQL"], "fairfriend", "interview", 89),
];

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  if (url.includes("delicate-lab") || url.includes("bitter-hill")) {
    throw new Error("Refusing to seed: DATABASE_URL points at a PROD host. Use the demo DB.");
  }
  const db = connect(url);

  console.log("Resetting demo data…");
  await db.delete(schema.applications);
  // Clear booking-dependent logs before bookings (FK: logs → bookings).
  await db.delete(schema.bookingActionLogs);
  await db.delete(schema.bookingRescheduleLogs);
  await db.delete(schema.bookings);
  await db.delete(schema.slots);
  await db.delete(schema.jobOpenings);
  await db.delete(schema.applicantProfiles);
  await db.delete(schema.recruiters);
  await db.delete(schema.eventConfig);
  await db.delete(schema.users);

  const pw = await bcrypt.hash("demo1234", 12);
  await db.insert(schema.users).values({ email: "admin@yangluck.demo", name: "Demo Admin", passwordHash: pw, role: "admin" });

  // Agency login (揚運) — the platform operator; sees the whole pipeline.
  const [agencyUser] = await db.insert(schema.users)
    .values({ email: "hr@yangluck.demo", name: "揚運 HR 陳小姐", passwordHash: pw, role: "recruiter" })
    .returning();
  await db.insert(schema.recruiters).values({
    userId: agencyUser.id,
    company: "揚運國際集團 Yang Luck",
    industry: "人力仲介 Manpower Agency",
    clientKind: "agency",
    description: "揚運國際集團 — 台中總部的國際人力仲介與派遣集團，為營造、製造、旅宿業客戶媒合學生與白領人才。",
    contactEmail: "hr@yangluck.demo",
    verified: true,
    interviewerCount: 3,
  });

  // Each client company is its own recruiter (appears in /browse) with positions.
  const recruiterIdByCompany: Record<string, number> = {};
  const jobIdByPos: Record<string, number> = {};
  let jobSeq = 0; // spreads seeded closing dates across mid-September
  for (const co of COMPANIES) {
    const [u] = await db.insert(schema.users)
      .values({ email: `co-${co.key}@yangluck.demo`, name: `${co.zh} HR`, passwordHash: pw, role: "recruiter" })
      .returning();
    const [r] = await db.insert(schema.recruiters).values({
      userId: u.id,
      company: `${co.zh} ${co.en}`,
      industry: co.industry,
      clientKind: co.kind,
      // Agency-vetted client/subsidiary → shows the "verified employer" badge.
      verified: true,
      description: `${co.zh}（${co.en}）— 揚運${co.kind === "subsidiary" ? "集團關係企業" : "合作客戶"}，${co.industry}。`,
      contactEmail: `hr@${co.key}.demo`,
    }).returning();
    recruiterIdByCompany[co.key] = r.id;

    const [min, max] = salary(co.industry);
    for (let i = 0; i < co.positions.length; i++) {
      const p = co.positions[i];
      const [row] = await db.insert(schema.jobOpenings).values({
        recruiterId: r.id,
        title: `${p.zh} ${p.en}`,
        jobCategory: co.industry,
        location: "台中 Taichung",
        employmentType: "full_time",
        workplaceType: "onsite",
        salaryMin: min,
        salaryMax: max,
        salaryCurrency: "TWD",
        salaryPeriod: "month",
        seniority: "entry_level",
        languageRequirement: p.lang,
        visaSupport: "case_by_case",
        // Closing date shown on the job card (a trust signal CBtalent lacks).
        applicationDeadline: `2026-09-${String(10 + (jobSeq++ % 18)).padStart(2, "0")}`,
        description: `${co.zh}｜由揚運媒合之${p.zh}職缺。`,
        requirements: "相關科系在學或應屆畢業；具備基本溝通能力。",
        moderationStatus: "approved",
        reviewedAt: new Date(),
      }).returning();
      jobIdByPos[`${co.key}:${i}`] = row.id;
    }
  }

  // Candidates + applications — application belongs to the client company.
  let n = 0;
  for (const c of CANDIDATES) {
    const jobId = jobIdByPos[`${c.company}:${c.posIndex}`] ?? jobIdByPos[`${c.company}:0`];
    const recId = recruiterIdByCompany[c.company];
    if (!jobId || !recId) continue;
    const [appl] = await db.insert(schema.applicantProfiles).values({
      name: `${c.name}（${c.nameZh}）`,
      email: `cand${n + 1}@yangluck.demo`,
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
      jobOpeningId: jobId,
      applicantId: appl.id,
      recruiterId: recId,
      stage: c.stage,
      aiScore: c.ai,
    });
    n++;
  }

  await db.insert(schema.eventConfig).values({
    eventName: "揚運 Yang Luck 人才媒合平台",
    eventDate: new Date("2026-08-01T09:00:00+08:00"),
    hostedAt: "揚運國際集團",
    location: "台中 Taichung",
    slotDurationMinutes: 30,
    salaryCurrencyOptions: ["TWD", "VND", "USD"],
  });

  const jobs = Object.keys(jobIdByPos).length;
  const stages = CANDIDATES.reduce((m, c) => ((m[c.stage] = (m[c.stage] || 0) + 1), m), {} as Record<string, number>);
  const companiesWithCands = new Set(CANDIDATES.map((c) => c.company)).size;
  console.log(`Seeded: ${COMPANIES.length} client companies (${COMPANIES.filter((c) => c.kind === "subsidiary").length} subsidiaries), ${jobs} positions, ${CANDIDATES.length} candidates.`);
  console.log(`Companies with candidates in the funnel: ${companiesWithCands}. Stage spread:`, stages);
  console.log("Showcase 麗明營造:", CANDIDATES.filter((c) => c.company === "leeming").length, "candidates.");
  console.log("Recruiter login: hr@yangluck.demo / demo1234");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

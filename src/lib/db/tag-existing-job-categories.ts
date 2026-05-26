import { neon } from "@neondatabase/serverless";

import {
  JOB_CATEGORY_OPTIONS,
  type JobCategoryValue,
  jobCategoryLabel,
} from "../job-posting";

type JobRow = {
  id: number;
  title: string;
  company: string;
  job_category: string | null;
  employment_type: string | null;
  seniority: string | null;
  description: string | null;
  responsibilities: string | null;
  requirements: string | null;
  benefits: string | null;
};

const categoryValues = new Set<string>(
  JOB_CATEGORY_OPTIONS.map((option) => option.value)
);

const keywordScores: Record<JobCategoryValue, RegExp[]> = {
  tech_engineering: [
    /\b(ai|data scientist|software engineer|hardware engineer|assistant engineer|test engineer|qa engineer|qra engineer|r&d|research and development)\b/i,
    /\b(ai|api|backend|cloud|data|database|developer|devops|engineer|engineering|frontend|full[-\s]?stack|hardware|information technology|it|machine learning|manufacturing engineer|network|programmer|qa|quality engineer|research and development|r&d|robotics|semiconductor|software|system|technical|technician|technology|test engineer|ui\/ux|web)\b/i,
    /工程師|工程|技術|科技|半導體|軟體|硬體|資訊|研發|資料|系統|測試|品保/i,
    /công nghệ|kỹ thuật|kỹ sư|phần mềm|dữ liệu|lập trình|hệ thống|bán dẫn/i,
  ],
  service_hospitality: [
    /\b(kfc|pizza hut|massage|spa|service crew|store staff)\b/i,
    /\b(barista|cafe|catering|chef|cleaning|customer service|food|front desk|guest|hospitality|hotel|kitchen|restaurant|retail service|service crew|server|store assistant|waiter|waitress)\b/i,
    /肯德基|必勝客|餐飲|餐廳|服務員|服務|客服|旅宿|飯店|門市|店員|廚房|接待|居酒屋|按摩|養生/i,
    /\b(dịch vụ|phục vụ|nhà hàng|khách sạn|chăm sóc khách hàng|cửa hàng|bán lẻ|massage|gội đầu|spa)\b/i,
  ],
  business: [
    /\b(business development|content|creative|livestream|market development|project manager|product manager|sales consultant|training coordinator|management trainee)\b/i,
    /\b(account|accounting|administration|admin|analyst|bd|business|business development|consultant|consulting|customer success|finance|hr|human resources|legal|marketing|operations|partnership|product manager|project manager|recruiter|sales|supply chain)\b/i,
    /業務|商務|行銷|營運|財務|會計|人資|法務|採購|專案|专案|專案管理|专案管理|產品經理|顧問|行政|管理師/i,
    /kinh doanh|marketing|tài chính|kế toán|nhân sự|vận hành|hành chính|tư vấn|bán hàng|pháp lý|nội dung|sáng tạo|đào tạo/i,
  ],
};

function inferJobCategory(job: JobRow): JobCategoryValue {
  const titleSignals = [job.title, job.company].filter(Boolean).join("\n");
  const searchable = [
    job.title,
    job.company,
    job.employment_type,
    job.seniority,
    job.description,
    job.responsibilities,
    job.requirements,
    job.benefits,
  ]
    .filter(Boolean)
    .join("\n");

  const scores = Object.fromEntries(
    JOB_CATEGORY_OPTIONS.map((option) => [option.value, 0])
  ) as Record<JobCategoryValue, number>;
  const titleScores = Object.fromEntries(
    JOB_CATEGORY_OPTIONS.map((option) => [option.value, 0])
  ) as Record<JobCategoryValue, number>;

  for (const [category, patterns] of Object.entries(keywordScores) as Array<
    [JobCategoryValue, RegExp[]]
  >) {
    for (const pattern of patterns) {
      if (pattern.test(titleSignals)) {
        scores[category] += 4;
        titleScores[category] += 1;
      }
      if (pattern.test(searchable)) scores[category] += 1;
    }
  }

  const titleRanked = JOB_CATEGORY_OPTIONS.map((option) => ({
    value: option.value,
    score: titleScores[option.value],
  })).sort((a, b) => b.score - a.score);
  if (
    titleRanked[0].score > 0 &&
    titleRanked[0].score > titleRanked[1].score
  ) {
    return titleRanked[0].value;
  }

  const ranked = JOB_CATEGORY_OPTIONS.map((option) => ({
    value: option.value,
    score: scores[option.value],
  })).sort((a, b) => b.score - a.score);

  return ranked[0].score > 0 ? ranked[0].value : "business";
}

async function main() {
  const url = process.env.DATABASE_URL;
  const apply = process.argv.includes("--apply");

  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const sql = neon(url);
  const rows = (await sql`
    SELECT
      jo.id,
      jo.title,
      jo.job_category,
      jo.employment_type,
      jo.seniority,
      jo.description,
      jo.responsibilities,
      jo.requirements,
      jo.benefits,
      r.company
    FROM job_openings jo
    INNER JOIN recruiters r ON r.id = jo.recruiter_id
    WHERE COALESCE(jo.job_category, '') = ''
    ORDER BY jo.id
  `) as JobRow[];

  const inferred = rows.map((job) => ({
    id: job.id,
    title: job.title,
    company: job.company,
    category: inferJobCategory(job),
  }));

  const counts = inferred.reduce<Record<string, number>>((acc, job) => {
    acc[job.category] = (acc[job.category] ?? 0) + 1;
    return acc;
  }, {});

  console.log(apply ? "Applying job categories" : "Dry run only");
  console.log(`Rows with blank category: ${rows.length}`);
  for (const option of JOB_CATEGORY_OPTIONS) {
    console.log(
      `${jobCategoryLabel(option.value) ?? option.label}: ${counts[option.value] ?? 0}`
    );
  }

  for (const job of inferred) {
    console.log(`#${job.id} ${job.company} - ${job.title} => ${job.category}`);
  }

  if (!apply) {
    console.log("No changes written. Re-run with -- --apply to update blank categories.");
    return;
  }

  for (const job of inferred) {
    if (!categoryValues.has(job.category)) continue;
    await sql`
      UPDATE job_openings
      SET job_category = ${job.category}
      WHERE id = ${job.id}
        AND COALESCE(job_category, '') = ''
    `;
  }

  console.log(`Updated ${inferred.length} job category rows`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

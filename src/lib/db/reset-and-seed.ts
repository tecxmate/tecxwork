import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import * as schema from "./schema";

async function resetAndSeed() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");

  const client = neon(url);
  const db = drizzle(client, { schema });

  console.log("Clearing all data...");
  await db.execute(sql`DELETE FROM bookings`);
  await db.execute(sql`DELETE FROM slots`);
  await db.execute(sql`DELETE FROM applicant_slots`);
  await db.execute(sql`DELETE FROM applicant_profiles`);
  await db.execute(sql`DELETE FROM job_openings`);
  await db.execute(sql`DELETE FROM recruiters`);
  await db.execute(sql`DELETE FROM users`);
  await db.execute(sql`DELETE FROM event_config`);
  await db.execute(sql`DELETE FROM allowed_domains`);
  console.log("Cleared.");

  // Admin
  const adminHash = await bcrypt.hash("admin123", 12);
  const [admin] = await db
    .insert(schema.users)
    .values({ email: "admin@vgen.tw", name: "Event Admin", passwordHash: adminHash, role: "admin" })
    .returning();
  console.log("Created admin:", admin.email);

  // Recruiters
  const companies = [
    { name: "TSMC Recruiter", email: "tsmc@vgen.tw", company: "TSMC", industry: "Semiconductor", description: "The world's largest dedicated independent semiconductor foundry.", jobTitles: ["Process Engineer", "Equipment Engineer", "R&D Researcher"], contactEmail: "campus@tsmc.com" },
    { name: "Google TW Recruiter", email: "google@vgen.tw", company: "Google Taiwan", industry: "Technology", description: "Taipei engineering office focusing on hardware and cloud.", jobTitles: ["Software Engineer", "Hardware Engineer", "UX Designer"], contactEmail: "tw-campus@google.com" },
    { name: "MediaTek Recruiter", email: "mediatek@vgen.tw", company: "MediaTek", industry: "Semiconductor", description: "Global fabless semiconductor company for mobile and IoT.", jobTitles: ["IC Design Engineer", "Firmware Engineer", "AI Researcher"], contactEmail: "hr@mediatek.com" },
    { name: "Cathay Recruiter", email: "cathay@vgen.tw", company: "Cathay Financial", industry: "Finance", description: "Taiwan's largest financial holding company.", jobTitles: ["Data Analyst", "Risk Manager", "Fintech Developer"], contactEmail: "recruit@cathayholdings.com.tw" },
    { name: "Appier Recruiter", email: "appier@vgen.tw", company: "Appier", industry: "Technology", description: "AI-driven SaaS company helping businesses solve marketing challenges.", jobTitles: ["ML Engineer", "Backend Engineer", "Solutions Architect"], contactEmail: "jobs@appier.com" },
    { name: "Deloitte Recruiter", email: "deloitte@vgen.tw", company: "Deloitte Taiwan", industry: "Consulting", description: "Professional services firm specializing in audit, tax, and consulting.", jobTitles: ["Consultant", "Auditor", "Tax Associate"], contactEmail: "tw-campus@deloitte.com" },
  ];

  const recruiterPassword = await bcrypt.hash("recruiter123", 12);
  const eventDate = "2026-06-06";

  for (const c of companies) {
    const [user] = await db
      .insert(schema.users)
      .values({ email: c.email, name: c.name, passwordHash: recruiterPassword, role: "recruiter" })
      .returning();

    const [rec] = await db
      .insert(schema.recruiters)
      .values({
        userId: user.id,
        company: c.company,
        industry: c.industry,
        description: c.description,
        contactEmail: c.contactEmail,
      })
      .returning();

    await db.insert(schema.jobOpenings).values(
      c.jobTitles.map((title) => ({
        recruiterId: rec.id,
        title,
        description: `${title} role at ${c.company}.`,
        moderationStatus: "approved" as const,
        reviewedAt: new Date(),
      }))
    );

    // 10:00–17:30, 15-min slots
    const slotValues: { recruiterId: number; startTime: Date; endTime: Date }[] = [];
    for (let h = 10; h <= 17; h++) {
      for (let m = 0; m < 60; m += 15) {
        if (h === 17 && m >= 30) break;
        const start = new Date(`${eventDate}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+08:00`);
        const end = new Date(start.getTime() + 15 * 60 * 1000);
        slotValues.push({ recruiterId: rec.id, startTime: start, endTime: end });
      }
    }
    await db.insert(schema.slots).values(slotValues);
    console.log(`Created ${c.company} (${c.email}) with ${slotValues.length} slots`);
  }

  // Event config
  await db.insert(schema.eventConfig).values({
    eventName: "V-GEN TRIDENT 2026",
    eventDate: new Date("2026-06-06T10:00:00+08:00"),
    location: "NTUT (Taipei Tech), Taipei",
    slotDurationMinutes: 15,
    mode: "both",
  });

  console.log("Seed complete!");
}

resetAndSeed().catch(console.error);

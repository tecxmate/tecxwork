import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import bcrypt from "bcryptjs";
import * as schema from "./schema";

async function seed() {
  const url = process.env.DB_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("DB_URL or DATABASE_URL not set");

  const sql = neon(url);
  const db = drizzle(sql, { schema });

  console.log("Seeding database...");

  // Admin user
  const adminHash = await bcrypt.hash("admin123", 12);
  const [admin] = await db
    .insert(schema.users)
    .values({ email: "admin@vgen.tw", name: "Event Admin", passwordHash: adminHash, role: "admin" })
    .onConflictDoNothing()
    .returning();

  if (admin) console.log("Created admin:", admin.email);

  // Sample recruiters
  const companies = [
    { name: "TSMC Recruiter", email: "tsmc@vgen.tw", company: "TSMC", industry: "Semiconductor", description: "The world's largest dedicated independent semiconductor foundry.", positions: ["Process Engineer", "Equipment Engineer", "R&D Researcher"], contactEmail: "campus@tsmc.com" },
    { name: "Google TW Recruiter", email: "google@vgen.tw", company: "Google Taiwan", industry: "Technology", description: "Taipei engineering office focusing on hardware and cloud.", positions: ["Software Engineer", "Hardware Engineer", "UX Designer"], contactEmail: "tw-campus@google.com" },
    { name: "MediaTek Recruiter", email: "mediatek@vgen.tw", company: "MediaTek", industry: "Semiconductor", description: "Global fabless semiconductor company for mobile and IoT.", positions: ["IC Design Engineer", "Firmware Engineer", "AI Researcher"], contactEmail: "hr@mediatek.com" },
    { name: "Cathay Recruiter", email: "cathay@vgen.tw", company: "Cathay Financial", industry: "Finance", description: "Taiwan's largest financial holding company.", positions: ["Data Analyst", "Risk Manager", "Fintech Developer"], contactEmail: "recruit@cathayholdings.com.tw" },
    { name: "Appier Recruiter", email: "appier@vgen.tw", company: "Appier", industry: "Technology", description: "AI-driven SaaS company helping businesses solve marketing challenges.", positions: ["ML Engineer", "Backend Engineer", "Solutions Architect"], contactEmail: "jobs@appier.com" },
    { name: "Deloitte Recruiter", email: "deloitte@vgen.tw", company: "Deloitte Taiwan", industry: "Consulting", description: "Professional services firm specializing in audit, tax, and consulting.", positions: ["Consultant", "Auditor", "Tax Associate"], contactEmail: "tw-campus@deloitte.com" },
  ];

  const recruiterPassword = await bcrypt.hash("recruiter123", 12);

  for (const c of companies) {
    const [user] = await db
      .insert(schema.users)
      .values({ email: c.email, name: c.name, passwordHash: recruiterPassword, role: "recruiter" })
      .onConflictDoNothing()
      .returning();

    if (user) {
      const [rec] = await db
        .insert(schema.recruiters)
        .values({
          userId: user.id,
          company: c.company,
          industry: c.industry,
          description: c.description,
          positions: c.positions,
          contactEmail: c.contactEmail,
        })
        .onConflictDoNothing()
        .returning();

      if (rec) {
        // Generate slots for event day: 9am-5pm, 15-min intervals
        const eventDate = "2026-06-06";
        const slotValues: { recruiterId: number; startTime: Date; endTime: Date }[] = [];
        for (let h = 9; h < 17; h++) {
          for (let m = 0; m < 60; m += 15) {
            const start = new Date(`${eventDate}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+08:00`);
            const end = new Date(start.getTime() + 15 * 60 * 1000);
            slotValues.push({ recruiterId: rec.id, startTime: start, endTime: end });
          }
        }
        await db.insert(schema.slots).values(slotValues).onConflictDoNothing();
        console.log(`Created recruiter ${c.company} with ${slotValues.length} slots`);
      }
    }
  }

  // Event config
  await db
    .insert(schema.eventConfig)
    .values({
      eventName: "V-GEN TRIDENT 2026",
      eventDate: new Date("2026-06-06T09:00:00+08:00"),
      location: "National Taiwan University, Taipei",
      slotDurationMinutes: 15,
    })
    .onConflictDoNothing();

  console.log("Seed complete!");
}

seed().catch(console.error);

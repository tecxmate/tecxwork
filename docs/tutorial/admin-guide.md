# Admin Guide — V-GEN TRIDENT Career Fair

## Overview

As the event admin, you manage the entire platform:
- **Recruiter access** — control which company email domains can sign up
- **Event mode** — choose booking direction (students book recruiters, recruiters book students, or both)
- **Mode lock** — prevent accidental mode changes during the event
- **People management** — view, search, and remove students and recruiters
- **Monitoring** — real-time stats on registrations, slots, and bookings

---

## Logging In

1. Go to the V-GEN website
2. Click **"I'm an Admin"** → **"Log In"**
3. Enter your admin credentials:
   - Email: `admin@vgen.tw`
   - Password: `admin123`
4. **Change this password immediately** for production use

---

## Dashboard Overview

The admin dashboard has four sections:

### 1. Stats (Top)

Five real-time counters:
- **Recruiters** — total registered recruiter accounts
- **Students** — total registered student accounts
- **Slots** — total interview slots across all recruiters
- **Available** — remaining unbooked slots
- **Bookings** — total confirmed bookings

### 2. Event Mode

Controls the booking flow for the event:

| Mode | What Happens |
|------|-------------|
| **Applicants book Recruiters** | Students browse companies → pick slots → book |
| **Recruiters book Applicants** | Recruiters browse student profiles → pick slots → book |
| **Both (Bidirectional)** | Both flows active simultaneously |

**How to set:**
1. Click the mode card you want
2. It saves immediately

**Locking the mode (recommended before event):**
1. Choose your mode
2. Click **"Unlocked"** button (top-right of the section)
3. Confirm → mode is now locked
4. Mode cards become disabled — no accidental changes
5. To unlock: click **"Locked"** button again

> **Tip:** Lock the mode at least 1 hour before the event starts.

### 3. Allowed Recruiter Domains

Controls which companies can sign up as recruiters.

**Adding a domain:**
1. Enter the email domain (e.g., `tsmc.com`)
2. Enter the company name (e.g., `TSMC`)
3. Select the industry
4. Click **"Add Domain"**

When a recruiter signs up with an email matching this domain (e.g., `jane@tsmc.com`), their profile is automatically pre-filled with the company name and industry.

**Removing a domain:**
- Click the trash icon next to any domain
- Existing recruiter accounts are NOT affected — only new signups are blocked

### 4. People

Two tabs: **Recruiters** and **Students**

**Viewing:**
- Sortable columns: click any header (Name, Email, Company, Industry, Major, Joined) to sort ascending/descending
- Search bar filters in real-time by name, email, company, or major

**Removing a person:**
1. Click the trash icon on their row
2. Confirm the deletion
3. This permanently deletes:
   - Their user account
   - Their profile
   - All their interview slots
   - All their bookings

> **Warning:** Deletion is irreversible. Export any needed data before removing.

---

## Pre-Event Checklist

### 2 weeks before
- [ ] Add all recruiter email domains to the allow-list
- [ ] Share the platform URL and recruiter signup instructions with participating companies
- [ ] Share the student signup link with target universities/groups

### 1 week before
- [ ] Verify all recruiters have signed up and have their slots
- [ ] Check the People tab — confirm recruiter count matches expectations
- [ ] Decide on the event mode (recommendation: "Applicants book Recruiters" for simplicity)

### 1 day before
- [ ] **Lock the event mode**
- [ ] Verify stats: slots available, registered students
- [ ] Test a booking yourself with a test student account

### Event day
- [ ] Monitor the dashboard for real-time booking stats
- [ ] Be available for support (password resets, account issues)
- [ ] Watch for any recruiters who haven't received bookings — may need troubleshooting

### 2 days after
- [ ] Export all booking data (admin bookings page or direct DB export)
- [ ] Delete all user data to comply with PIPA
- [ ] Notify recruiters that data has been purged

---

## Troubleshooting

**"A recruiter says they can't sign up"**
→ Check that their email domain is in the Allowed Domains list. Add it if missing.

**"A student says they can't log in"**
→ They may have mistyped their email during registration. Check the Students tab for their email. If needed, delete their account so they can re-register.

**"I need to change a recruiter's company info"**
→ Currently requires direct database access. Delete and re-create the recruiter account, or contact the developer.

**"The mode accidentally changed during the event"**
→ That's what mode lock prevents. If it happens, switch back and lock it immediately.

---

## Technical Notes

- **Platform**: Next.js on Vercel (auto-scaling, handles 1,000+ concurrent users)
- **Database**: Neon Postgres (serverless, auto-scaling connections)
- **Auth**: JWT cookies, bcrypt password hashing
- **Booking**: Atomic slot locking — no double-bookings possible
- **PIPA**: All data can be purged by clearing the database after the event
- **Designed & Developed by**: [TECXMATE.COM](https://tecxmate.com)

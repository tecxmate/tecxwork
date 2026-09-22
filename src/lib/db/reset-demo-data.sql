-- Replace all third-party data on work.tecxmate.com with fictional demo data.
--
-- KEPT (ours): schools, event_config settings/toggles, admin accounts, all
-- empty ATS/billing tables. WIPED + RESEEDED (third-party): recruiter and
-- applicant accounts, companies, job openings, interview slots, bookings, and
-- every log/token table holding real personal data.
--
-- Run:  psql "$DATABASE_URL" -1 -v ON_ERROR_STOP=1 -f reset-demo-data.sql
-- All demo logins use the password: demo1234

BEGIN;

-- ---------------------------------------------------------------- 1. WIPE --
-- Children first so foreign keys stay satisfied throughout.

-- The dormant `legacy` schema holds two tables that point at people we are
-- about to delete, so they have to go with them. The rest of `legacy`
-- (external_jobs, crawl_logs, organizations, events) is left untouched.
DELETE FROM legacy.event_participants;
DELETE FROM legacy.memberships;

DELETE FROM booking_action_logs;
DELETE FROM booking_reschedule_logs;
DELETE FROM bookings;
DELETE FROM applicant_slots;
DELETE FROM slots;
DELETE FROM notifications;
DELETE FROM push_subscriptions;
DELETE FROM email_logs;
DELETE FROM email_verification_codes;
DELETE FROM password_reset_codes;
DELETE FROM sessions;
DELETE FROM applicant_profiles;
DELETE FROM job_openings;
DELETE FROM recruiters;
DELETE FROM recruiter_email_approvals;
DELETE FROM allowed_domains;
DELETE FROM users WHERE role <> 'admin';

-- ------------------------------------------------- 2. EMPLOYERS (12 firms) --
-- Invented companies. Every domain is under example.com (RFC 2606), so no
-- demo address can ever resolve or receive mail.

WITH co(company, industry, domain, person, descr, positions, web, ivc) AS (
  VALUES
    ('Nimbus Silicon',          'Technology',      'nimbussilicon.example.com',     'Chen Yu-Ting',   'Fabless designer of low-power edge-AI accelerators for industrial sensing.',        'IC Design Engineer|Firmware Engineer|Verification Engineer', 'https://nimbussilicon.example.com', 2),
    ('Lantern Bay Digital',     'Technology',      'lanternbay.example.com',        'Alice Kuo',      'Product studio building logistics and payments software for Southeast Asia.',      'Backend Engineer|Frontend Engineer|Product Designer',        'https://lanternbay.example.com',    2),
    ('Verdant Systems',         'Technology',      'verdantsystems.example.com',    'Marcus Liao',    'Cloud platform for factory energy monitoring and emissions reporting.',            'Platform Engineer|Data Engineer|Solutions Architect',        'https://verdantsystems.example.com',1),
    ('Riverstone Robotics',     'Manufacturing',   'riverstonerobotics.example.com','Hsu Wei-Chen',   'Builds collaborative robot arms for precision assembly lines.',                    'Mechanical Engineer|Controls Engineer|Field Service Engineer','https://riverstonerobotics.example.com',2),
    ('Copperline Precision',    'Manufacturing',   'copperline.example.com',        'Lin Pei-Shan',   'Contract manufacturer of precision connectors and thermal components.',            'Process Engineer|Quality Engineer|Production Planner',       'https://copperline.example.com',    2),
    ('Cedar Harbor Consulting', 'Consulting',      'cedarharbor.example.com',       'Daniel Weng',    'Cross-border strategy and operations advisory for mid-market manufacturers.',      'Associate Consultant|Business Analyst|Management Trainee',   'https://cedarharbor.example.com',   1),
    ('Meridian Trust Capital',  'Finance',         'meridiantrust.example.com',     'Grace Tsai',     'Asset manager focused on regional infrastructure and green-transition funds.',     'Investment Analyst|Risk Analyst|Fintech Developer',          'https://meridiantrust.example.com', 1),
    ('Blue Heron Foods',        'Food & Beverage', 'blueheronfoods.example.com',    'Sophia Chang',   'Plant-forward packaged food maker with its own regional distribution network.',    'Food Scientist|Supply Chain Associate|Brand Marketing Associate','https://blueheronfoods.example.com',1),
    ('Willow Peak Health',      'Healthcare',      'willowpeak.example.com',        'Dr. Amy Hsieh',  'Network of outpatient clinics piloting bilingual digital-first patient care.',     'Clinical Data Analyst|Health Informatics Associate|Patient Experience Coordinator','https://willowpeak.example.com',1),
    ('Stonebridge Construction','Construction',    'stonebridgetw.example.com',     'Roger Tang',     'Civil contractor delivering transit, campus, and water-infrastructure projects.',  'Site Engineer|BIM Engineer|Project Coordinator',             'https://stonebridgetw.example.com', 2),
    ('Orchid Grove Hospitality','Service & Hospitality','orchidgrove.example.com',  'Vivian Ho',      'Boutique hotel and resort group operating eight properties island-wide.',          'Front Office Associate|Events Coordinator|Management Trainee','https://orchidgrove.example.com',  1),
    ('Compass Point Education', 'Education',       'compasspoint.example.com',      'Kevin Lu',       'Bilingual training provider running career and language programs for students.',   'Program Coordinator|Curriculum Designer|Student Success Associate','https://compasspoint.example.com',1)
),
ins_users AS (
  INSERT INTO users (email, name, password_hash, role)
  SELECT 'hr@' || domain, person, '$2b$12$qkuSMtYZav9.ffCWG7WQI.y872i4850CvxLKZLt0gVag1Lz9p.0Jm', 'recruiter'
  FROM co
  RETURNING id, email
)
INSERT INTO recruiters (user_id, company, industry, description, positions, contact_email, website_url, interviewer_count, verified)
SELECT u.id, c.company, c.industry, c.descr, string_to_array(c.positions, '|'),
       'hr@' || c.domain, c.web, c.ivc, true
FROM co c
JOIN ins_users u ON u.email = 'hr@' || c.domain;

-- Admin signup allow-list, rebuilt around the demo employers.
INSERT INTO allowed_domains (domain, company, industry)
SELECT split_part(contact_email, '@', 2), company, industry FROM recruiters;

INSERT INTO recruiter_email_approvals (email, company, industry, status)
SELECT contact_email, company, industry, 'approved' FROM recruiters;


-- ------------------------------------------------ 3. JOB OPENINGS (30) --

INSERT INTO job_openings (
  recruiter_id, title, job_category, location, employment_type, workplace_type,
  salary_min, salary_max, salary_currency, salary_period, seniority,
  language_requirement, visa_support, description, responsibilities,
  requirements, benefits, moderation_status, application_deadline
)
SELECT r.id, j.title, j.cat, j.loc, j.etype, j.wtype, j.smin, j.smax, 'TWD', 'month',
       j.sen, j.lang, j.visa, j.descr, j.resp, j.req, j.benefits, 'approved', '2026-11-07'
FROM (VALUES
  ('Nimbus Silicon','IC Design Engineer','tech_engineering','Hsinchu','full_time','onsite',55000,78000,'entry','Mandarin or English','Sponsors ARC and work permit','Own a block of a low-power edge-AI accelerator from RTL through silicon bring-up.','Write and verify RTL; run synthesis and timing closure; support bring-up in the lab.','BS/MS in EE or CS; Verilog/SystemVerilog; a tape-out project is a plus.','Annual bonus, stock units, subsidised lunch, relocation support.'),
  ('Nimbus Silicon','Firmware Engineer','tech_engineering','Hsinchu','full_time','hybrid',52000,72000,'entry','Mandarin or English','Sponsors ARC and work permit','Write the embedded layer that drives our accelerator on customer hardware.','Develop C drivers and bootloaders; profile power and latency; support field debug.','BS in CS/EE; C and embedded Linux; RTOS exposure welcome.','Annual bonus, hardware stipend, flexible hours.'),
  ('Nimbus Silicon','Verification Engineer','tech_engineering','Hsinchu','full_time','onsite',54000,74000,'entry','Mandarin or English','Sponsors ARC and work permit','Build the verification environment that keeps our silicon honest before tape-out.','Write UVM testbenches; drive coverage closure; triage regressions.','BS/MS in EE/CS; SystemVerilog; scripting in Python.','Annual bonus, training budget, subsidised lunch.'),
  ('Lantern Bay Digital','Backend Engineer','tech_engineering','Taipei','full_time','hybrid',58000,85000,'entry','English','Sponsors ARC and work permit','Build the payments and logistics services behind our regional merchant platform.','Design and ship APIs; own service reliability; work with product on scope.','BS in CS or equivalent; one of Go/Node/Python; SQL comfort.','Remote-friendly, learning budget, annual offsite.'),
  ('Lantern Bay Digital','Frontend Engineer','tech_engineering','Taipei','full_time','hybrid',55000,80000,'entry','English','Sponsors ARC and work permit','Own merchant-facing dashboards used daily across six markets.','Build React interfaces; improve performance; partner closely with design.','BS in CS or a strong portfolio; React and TypeScript.','Remote-friendly, hardware of your choice, learning budget.'),
  ('Lantern Bay Digital','Product Designer','business','Taipei','full_time','hybrid',50000,72000,'entry','English','Sponsors ARC and work permit','Shape how thousands of small merchants run their day-to-day operations.','Run discovery; produce flows and prototypes; maintain the design system.','Portfolio showing shipped product work; Figma fluency.','Remote-friendly, conference budget, annual offsite.'),
  ('Verdant Systems','Platform Engineer','tech_engineering','Taipei','full_time','remote',60000,88000,'mid','English','Sponsors ARC and work permit','Keep the ingestion platform behind our factory energy analytics fast and boring.','Run Kubernetes workloads; own CI/CD; improve observability.','2+ years in backend or infrastructure; Docker and Kubernetes; IaC.','Fully remote, home-office stipend, four-day summer Fridays.'),
  ('Verdant Systems','Data Engineer','tech_engineering','Taipei','full_time','remote',58000,84000,'entry','English','Sponsors ARC and work permit','Turn raw meter telemetry into the numbers customers report to regulators.','Build streaming and batch pipelines; model warehouse tables; guard data quality.','BS in CS/Stats; SQL and Python; exposure to Spark or dbt.','Fully remote, home-office stipend, learning budget.'),
  ('Verdant Systems','Solutions Architect','business','Taipei','full_time','hybrid',65000,95000,'mid','English and Mandarin','Sponsors ARC and work permit','Sit between our platform and the plant engineers who have to live with it.','Scope deployments; run technical workshops; feed requirements back to product.','3+ years customer-facing technical work; comfortable on a factory floor.','Travel allowance, performance bonus, hybrid schedule.'),
  ('Riverstone Robotics','Mechanical Engineer','tech_engineering','Taichung','full_time','onsite',48000,68000,'entry','Mandarin','Sponsors ARC and work permit','Design the joints and housings inside our collaborative robot arms.','Produce CAD and tolerance stacks; run design reviews; support pilot builds.','BS in Mechanical Engineering; SolidWorks; GD&T basics.','Shuttle bus, annual bonus, on-site gym.'),
  ('Riverstone Robotics','Controls Engineer','tech_engineering','Taichung','full_time','onsite',52000,74000,'entry','Mandarin','Sponsors ARC and work permit','Tune the motion control that makes a six-axis arm feel precise.','Develop motion profiles; calibrate sensors; commission systems at customer sites.','BS in EE/ME/Mechatronics; PLC or motion control exposure.','Shuttle bus, travel allowance, annual bonus.'),
  ('Riverstone Robotics','Field Service Engineer','service_hospitality','Taichung','full_time','onsite',45000,62000,'entry','Mandarin','Sponsors ARC and work permit','Be the person customers call when a line goes down.','Install and commission systems; run preventive maintenance; train operators.','Technical diploma or BS; willing to travel domestically.','Vehicle allowance, overtime pay, certification support.'),
  ('Copperline Precision','Process Engineer','tech_engineering','Kaohsiung','full_time','onsite',46000,66000,'entry','Mandarin','Sponsors ARC and work permit','Own the yield and cycle time of a connector production cell.','Run DOEs; drive SPC; lead continuous-improvement projects.','BS in IE/ME/ChemE; statistics comfort; Minitab a plus.','Dormitory available, shift premium, annual bonus.'),
  ('Copperline Precision','Quality Engineer','tech_engineering','Kaohsiung','full_time','onsite',45000,64000,'entry','Mandarin','Sponsors ARC and work permit','Hold the line on quality between our floor and the customer''s incoming dock.','Run inspections and audits; lead 8D investigations; maintain quality documents.','BS in engineering; ISO 9001 or IATF exposure welcome.','Dormitory available, annual bonus, training budget.'),
  ('Copperline Precision','Production Planner','business','Kaohsiung','full_time','onsite',44000,60000,'entry','Mandarin','Sponsors ARC and work permit','Balance what sales promised against what the floor can actually build.','Own the master schedule; manage material flow; report on OTD.','BS in IE/Business/Supply Chain; strong Excel; ERP exposure.','Dormitory available, annual bonus, shuttle bus.'),
  ('Cedar Harbor Consulting','Associate Consultant','business','Taipei','full_time','hybrid',52000,72000,'entry','English and Mandarin','Sponsors ARC and work permit','Join client teams solving operations and market-entry problems.','Run analysis; build models and decks; present findings to client managers.','BS/MS any discipline; strong analytics and communication.','Performance bonus, MBA sponsorship track, travel allowance.'),
  ('Cedar Harbor Consulting','Business Analyst','business','Taipei','full_time','hybrid',48000,66000,'entry','English and Mandarin','Sponsors ARC and work permit','Turn messy client data into the one chart that settles the argument.','Gather and clean data; build dashboards; support engagement leads.','BS in Business/Economics/Stats; Excel and SQL; Python a plus.','Performance bonus, training budget, hybrid schedule.'),
  ('Cedar Harbor Consulting','Management Trainee','business','Taipei','full_time','onsite',45000,58000,'entry','English and Mandarin','Sponsors ARC and work permit','An 18-month rotation across strategy, operations, and client delivery.','Rotate through three practices; own a capstone project; present to partners.','Fresh graduate, any discipline; strong academic record.','Structured mentorship, rotation housing, performance bonus.'),
  ('Meridian Trust Capital','Investment Analyst','business','Taipei','full_time','onsite',58000,82000,'entry','English and Mandarin','Sponsors ARC and work permit','Cover regional infrastructure and green-transition names for the fund.','Build financial models; write investment memos; monitor portfolio companies.','BS/MS in Finance/Economics; modelling skills; CFA track a plus.','Annual bonus, CFA sponsorship, health coverage.'),
  ('Meridian Trust Capital','Risk Analyst','business','Taipei','full_time','hybrid',54000,76000,'entry','English and Mandarin','Sponsors ARC and work permit','Quantify what could go wrong before the investment committee does.','Run scenario and stress analysis; maintain limits; report to the risk committee.','BS in Finance/Math/Stats; Python or R; SQL.','Annual bonus, certification support, hybrid schedule.'),
  ('Meridian Trust Capital','Fintech Developer','tech_engineering','Taipei','full_time','hybrid',60000,86000,'entry','English','Sponsors ARC and work permit','Build the internal tools the investment team actually uses every morning.','Develop portfolio and reporting tools; integrate market data; automate workflows.','BS in CS; Python and SQL; interest in capital markets.','Annual bonus, learning budget, hybrid schedule.'),
  ('Blue Heron Foods','Food Scientist','tech_engineering','Tainan','full_time','onsite',44000,62000,'entry','Mandarin','Sponsors ARC and work permit','Develop plant-forward products from bench trial to full production run.','Run formulation trials; manage shelf-life testing; scale recipes to the line.','BS/MS in Food Science; HACCP familiarity.','Product allowance, annual bonus, on-site canteen.'),
  ('Blue Heron Foods','Supply Chain Associate','business','Tainan','full_time','onsite',42000,56000,'entry','Mandarin','Sponsors ARC and work permit','Keep raw material flowing into the plant and product flowing out.','Manage purchase orders and inventory; coordinate logistics; track supplier KPIs.','BS in Supply Chain/Business; Excel and ERP comfort.','Annual bonus, shuttle bus, on-site canteen.'),
  ('Blue Heron Foods','Brand Marketing Associate','business','Taipei','full_time','hybrid',42000,58000,'entry','Mandarin and English','Sponsors ARC and work permit','Tell the story of our products across retail and social channels.','Plan campaigns; produce content; report on channel performance.','BS in Marketing/Communications; portfolio of campaign or content work.','Product allowance, hybrid schedule, learning budget.'),
  ('Willow Peak Health','Clinical Data Analyst','tech_engineering','Taipei','full_time','hybrid',50000,70000,'entry','Mandarin and English','Sponsors ARC and work permit','Turn clinic operations data into decisions doctors and managers trust.','Build reporting pipelines; analyse outcomes; support quality reviews.','BS in Stats/Public Health/CS; SQL and Python; privacy awareness.','Health coverage, continuing-education budget, hybrid schedule.'),
  ('Willow Peak Health','Health Informatics Associate','tech_engineering','Taipei','full_time','onsite',46000,64000,'entry','Mandarin and English','Sponsors ARC and work permit','Bridge clinical workflow and the systems meant to support it.','Map workflows; configure the EMR; train clinical staff on releases.','BS in Health Informatics/Nursing/CS; strong communication.','Health coverage, training budget, meal allowance.'),
  ('Willow Peak Health','Patient Experience Coordinator','service_hospitality','Taipei','full_time','onsite',40000,54000,'entry','Mandarin and English','Sponsors ARC and work permit','Own how it feels to be a patient from booking through follow-up.','Manage scheduling and intake; resolve escalations; run satisfaction surveys.','BS any discipline; service background; bilingual.','Health coverage, meal allowance, shift premium.'),
  ('Stonebridge Construction','Site Engineer','tech_engineering','Taoyuan','full_time','onsite',48000,68000,'entry','Mandarin','Sponsors ARC and work permit','Run a work package on a live transit or campus project.','Supervise subcontractors; track progress and quality; enforce site safety.','BS in Civil Engineering; willing to work on site full time.','Site allowance, overtime pay, accommodation support.'),
  ('Stonebridge Construction','BIM Engineer','tech_engineering','Taoyuan','full_time','hybrid',50000,70000,'entry','Mandarin','Sponsors ARC and work permit','Keep the model and the actual building in agreement.','Develop and coordinate BIM models; run clash detection; produce drawings.','BS in Civil/Architecture; Revit and Navisworks.','Hybrid schedule, certification support, annual bonus.'),
  ('Orchid Grove Hospitality','Front Office Associate','service_hospitality','Hualien','full_time','onsite',36000,48000,'entry','Mandarin, English, or Vietnamese','Sponsors ARC and work permit','Be the first and last impression at a boutique resort property.','Handle check-in and guest requests; coordinate with housekeeping; resolve issues.','Diploma or BS in Hospitality or related; service mindset; shift work.','Staff accommodation, meals on duty, service charge share.'),
  ('Compass Point Education','Program Coordinator','service_hospitality','Taipei','full_time','onsite',40000,54000,'entry','Mandarin, English, or Vietnamese','Sponsors ARC and work permit','Run the career and language programs students actually show up for.','Schedule cohorts; support instructors; track student outcomes.','BS any discipline; bilingual; comfortable in front of a room.','Free course enrolment, annual bonus, meal allowance.')
) AS j(company, title, cat, loc, etype, wtype, smin, smax, sen, lang, visa, descr, resp, req, benefits)
JOIN recruiters r ON r.company = j.company;

-- ------------------------------------------------- 4. APPLICANTS (40) --
-- Fictional students. Schools are drawn from our own `schools` table, which is
-- left untouched. Every address is @example.com and cannot receive mail.

WITH ap(name, nationality, major, level, skills) AS (
  VALUES
    ('Nguyen Minh Anh','Vietnam','Computer Science','Bachelor','Python|React|SQL'),
    ('Tran Thu Ha','Vietnam','International Business','Bachelor','Market Research|Excel|Mandarin'),
    ('Le Quoc Bao','Vietnam','Electrical Engineering','Master','Verilog|MATLAB|C'),
    ('Pham Thi Lan','Vietnam','Finance','Bachelor','Financial Modelling|Excel|Bloomberg'),
    ('Hoang Van Nam','Vietnam','Mechanical Engineering','Bachelor','SolidWorks|GD&T|AutoCAD'),
    ('Vu Ngoc Mai','Vietnam','Data Science','Master','Python|Pandas|Tableau'),
    ('Dang Huu Phuc','Vietnam','Computer Science','Bachelor','Go|Docker|Kubernetes'),
    ('Bui Thanh Tu','Vietnam','Industrial Engineering','Bachelor','Minitab|Lean|SPC'),
    ('Do Kim Ngan','Vietnam','Marketing','Bachelor','Content Strategy|Figma|Analytics'),
    ('Ngo Gia Huy','Vietnam','Civil Engineering','Bachelor','Revit|Navisworks|AutoCAD'),
    ('Duong Hai Yen','Vietnam','Hospitality Management','Bachelor','Guest Relations|Opera PMS|English'),
    ('Ly Tuan Kiet','Vietnam','Computer Science','Master','TypeScript|Node.js|PostgreSQL'),
    ('Phan Bao Chau','Vietnam','Food Science','Master','HACCP|Sensory Analysis|Formulation'),
    ('Trinh Dinh Long','Vietnam','Electrical Engineering','Bachelor','Embedded C|RTOS|PCB Design'),
    ('Cao Thuy Linh','Vietnam','Public Health','Master','SQL|R|Epidemiology'),
    ('Ha Minh Duc','Vietnam','Mechatronics','Bachelor','PLC|Motion Control|ROS'),
    ('Luu Khanh Vy','Vietnam','Supply Chain Management','Bachelor','SAP|Excel|Logistics'),
    ('Mai Quang Dung','Vietnam','Chemical Engineering','Master','Process Simulation|Aspen|Six Sigma'),
    ('Chu Ngoc Diep','Vietnam','Graphic Design','Bachelor','Figma|Illustrator|Prototyping'),
    ('Ton That Khoa','Vietnam','Economics','Bachelor','Stata|Econometrics|Excel'),
    ('Putri Anggraini','Indonesia','Information Systems','Bachelor','Java|SQL|Business Analysis'),
    ('Bagus Wicaksono','Indonesia','Mechanical Engineering','Bachelor','CAD|FEA|Manufacturing'),
    ('Dewi Lestari','Indonesia','Accounting','Bachelor','IFRS|Excel|Audit'),
    ('Rizky Ramadhan','Indonesia','Computer Science','Master','Machine Learning|PyTorch|Python'),
    ('Maria Santos','Philippines','Nursing','Bachelor','Patient Care|EMR|English'),
    ('Jose Villanueva','Philippines','Civil Engineering','Bachelor','Site Supervision|AutoCAD|Safety'),
    ('Angeline Cruz','Philippines','Hospitality Management','Bachelor','Front Office|Events|English'),
    ('Nurul Aisyah','Malaysia','Chemical Engineering','Bachelor','Process Control|HAZOP|Six Sigma'),
    ('Tan Wei Ming','Malaysia','Computer Science','Bachelor','React|Node.js|AWS'),
    ('Chen Yi-Hsuan','Taiwan','Electrical Engineering','Master','SystemVerilog|UVM|Python'),
    ('Lin Chia-Wei','Taiwan','Materials Science','Master','TEM|Thin Films|MATLAB'),
    ('Wu Pei-Chun','Taiwan','Business Administration','Bachelor','Excel|PowerPoint|Mandarin'),
    ('Huang Cheng-Hao','Taiwan','Computer Science','Bachelor','C++|Algorithms|Linux'),
    ('Somchai Prasert','Thailand','Industrial Engineering','Bachelor','Lean|Simulation|Excel'),
    ('Nattaya Wong','Thailand','Marketing','Bachelor','Social Media|Analytics|Copywriting'),
    ('Aung Min Khant','Myanmar','Computer Science','Bachelor','Python|Django|SQL'),
    ('Sokha Chan','Cambodia','Economics','Bachelor','Data Analysis|Excel|English'),
    ('Priya Raman','India','Data Science','Master','Spark|Python|dbt'),
    ('Arjun Nair','India','Electrical Engineering','Master','Analog Design|Cadence|MATLAB'),
    ('Kim Ji-Woo','South Korea','International Business','Bachelor','Korean|English|Market Entry')
),
numbered AS (
  SELECT ap.*, row_number() OVER (ORDER BY name) AS rn FROM ap
),
sch AS (
  SELECT code, name_zh, name_en,
         row_number() OVER (ORDER BY code) AS rn,
         count(*) OVER () AS total
  FROM schools
),
ins_users AS (
  INSERT INTO users (email, name, password_hash, role)
  SELECT 'demo.applicant' || lpad(rn::text, 2, '0') || '@example.com', name,
         '$2b$12$qkuSMtYZav9.ffCWG7WQI.y872i4850CvxLKZLt0gVag1Lz9p.0Jm', 'applicant'
  FROM numbered
  RETURNING id, email
)
INSERT INTO applicant_profiles (
  user_id, name, email, phone, nationality, school_code, school_name, school_name_en,
  major, study_level, study_year, expected_graduation, job_seeking_status,
  work_authorization, skills, preferred_locations, preferred_industries,
  cv_link, description, pipa_consent, consent_at, consent_purpose, retention_until
)
SELECT u.id, n.name,
       'demo.applicant' || lpad(n.rn::text, 2, '0') || '@example.com',
       '09' || lpad(((n.rn * 1234567) % 100000000)::text, 8, '0'),
       n.nationality, s.code, s.name_zh, s.name_en, n.major, n.level,
       (CASE (n.rn % 3) WHEN 0 THEN 'Year 3' WHEN 1 THEN 'Year 4' ELSE 'Year 2' END),
       (CASE (n.rn % 2) WHEN 0 THEN '2027-06' ELSE '2026-06' END),
       (CASE (n.rn % 3) WHEN 0 THEN 'actively_looking' WHEN 1 THEN 'open_to_offers' ELSE 'graduating_soon' END),
       'Student visa — requires employer work-permit sponsorship',
       string_to_array(n.skills, '|'),
       string_to_array((CASE (n.rn % 4) WHEN 0 THEN 'Taipei|Hsinchu' WHEN 1 THEN 'Taichung|Taipei' WHEN 2 THEN 'Kaohsiung|Tainan' ELSE 'Taipei|Taoyuan' END), '|'),
       string_to_array((CASE (n.rn % 4) WHEN 0 THEN 'Technology|Manufacturing' WHEN 1 THEN 'Finance|Consulting' WHEN 2 THEN 'Healthcare|Education' ELSE 'Technology|Service & Hospitality' END), '|'),
       'https://example.com/demo/cv/demo-applicant-' || lpad(n.rn::text, 2, '0') || '.pdf',
       'Fictional demo profile. ' || n.major || ' student seeking a first full-time role in Taiwan.',
       true, now(), 'Demo career-fair matching (fictional data)', '2027-12-31'
FROM numbered n
JOIN sch s ON s.rn = ((n.rn * 7) % s.total) + 1
JOIN ins_users u ON u.email = 'demo.applicant' || lpad(n.rn::text, 2, '0') || '@example.com';

-- --------------------------------------------- 5. INTERVIEW SLOTS --
-- Demo fair: 2026-11-14, 14:30–17:30 Taipei (06:30–09:30 UTC).
-- 15-minute interviews on a 20-minute cadence (15 + 5 buffer).

INSERT INTO slots (recruiter_id, start_time, end_time, interviewer_number, status)
SELECT r.id, ts, ts + interval '15 minutes', iv, 'available'
FROM recruiters r
CROSS JOIN LATERAL generate_series(1, r.interviewer_count) AS iv
CROSS JOIN generate_series(
  timestamptz '2026-11-14 06:30:00+00',
  timestamptz '2026-11-14 09:10:00+00',
  interval '20 minutes') AS ts;

-- ------------------------------------------------- 6. BOOKINGS --
-- Two waves per applicant against different employers, with a status mix that
-- mirrors the shape of a real fair (pending / accepted / rejected / …).

WITH a AS (
  SELECT id, name, email, cv_link, row_number() OVER (ORDER BY id) AS rn FROM applicant_profiles
),
j AS (
  SELECT id, recruiter_id, title, row_number() OVER (ORDER BY id) AS rn,
         count(*) OVER () AS total
  FROM job_openings
),
pairs AS (
  SELECT a.*, j.id AS job_id, j.recruiter_id, j.title, 1 AS wave
  FROM a JOIN j ON j.rn = ((a.rn - 1) % j.total) + 1
  UNION ALL
  SELECT a.*, j.id, j.recruiter_id, j.title, 2
  FROM a JOIN j ON j.rn = ((a.rn + 12) % j.total) + 1
  WHERE a.rn % 2 = 0
)
INSERT INTO bookings (
  direction, recruiter_id, job_opening_id, applicant_id, position,
  requested_time, applicant_name, applicant_email, cv_link, pipa_consent,
  status, created_at
)
SELECT 'applicant_books_recruiter', p.recruiter_id, p.job_id, p.id, p.title,
       timestamptz '2026-11-14 06:30:00+00' + (((p.rn + p.wave) % 9) * interval '20 minutes'),
       p.name, p.email, p.cv_link, true,
       (CASE ((p.rn * 3 + p.wave) % 10)
          WHEN 0 THEN 'accepted'  WHEN 1 THEN 'accepted'  WHEN 2 THEN 'accepted'
          WHEN 3 THEN 'pending'   WHEN 4 THEN 'pending'   WHEN 5 THEN 'pending'
          WHEN 6 THEN 'rejected'  WHEN 7 THEN 'rejected'
          WHEN 8 THEN 'waitlisted'
          ELSE 'cancelled'
        END)::booking_status,
       now() - ((p.rn % 14) * interval '1 day')
FROM pairs p;

-- Give every accepted booking a real slot, and mark that slot taken.
WITH acc AS (
  SELECT id, recruiter_id, row_number() OVER (PARTITION BY recruiter_id ORDER BY id) AS rn
  FROM bookings WHERE status = 'accepted'
),
sl AS (
  SELECT id, recruiter_id, start_time,
         row_number() OVER (PARTITION BY recruiter_id ORDER BY start_time, interviewer_number) AS rn
  FROM slots
),
m AS (
  SELECT acc.id AS booking_id, sl.id AS slot_id, sl.start_time
  FROM acc JOIN sl ON sl.recruiter_id = acc.recruiter_id AND sl.rn = acc.rn
)
UPDATE bookings b
SET slot_id = m.slot_id, requested_time = m.start_time
FROM m WHERE b.id = m.booking_id;

UPDATE slots SET status = 'booked'
WHERE id IN (SELECT slot_id FROM bookings WHERE slot_id IS NOT NULL);

-- --------------------------------------- 7. EVENT BRANDING (demo) --
-- Only the third-party organiser/venue identity changes. Every functional
-- setting (mode, slot length, hours, toggles, image URLs) is left alone.

UPDATE event_config SET
  event_name       = 'TECXWORK DEMO CAREER FAIR 2026',
  email_event_name = 'TECXWORK DEMO CAREER FAIR 2026',
  tagline          = 'A demonstration career fair — every company, student, and booking here is fictional.',
  organizer        = 'TECXWORK Demo Organizer',
  organizer_short  = 'TECXWORK',
  location         = 'Demo Campus Convention Hall',
  hosted_at        = 'Demo Campus Convention Hall',
  hosted_at_full   = 'Demo Campus Convention Hall',
  event_date       = timestamptz '2026-11-14 06:30:00+00',
  event_end_date   = timestamptz '2026-11-14 09:30:00+00',
  display_date     = 'November 14, 2026',
  display_year     = '2026';

COMMIT;

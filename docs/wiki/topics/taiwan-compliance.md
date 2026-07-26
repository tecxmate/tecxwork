---
title: Taiwan Legal Compliance
type: topic
slug: taiwan-compliance
date: 2026-05-04
updated: 2026-07-27
attributed_to: [gpt, niko]
belongs_to: [tecxmate]
source: document
status: active
tags: [legal, compliance, taiwan, mol, pipa]
related: [taiwan-mol, data-privacy, yang-luck, 2026-07-27-yang-luck-licensee-positioning]
---

## Overview
Operating a recruitment platform in Taiwan involves navigating the Employment Service Act and the Personal Data Protection Act (PDPA/PIPA).

## 1. Employment Service Act (ESA)
- **Matching vs. Scheduling**: A "Private Employment Service Agency" license is required for platforms that actively match employers with job seekers for profit.
- **Strategy (unlicensed Tecxmate product only)**: Position the tool as "event operations software" (scheduling only) rather than an "employment agency" to minimize immediate licensing requirements while the product is being validated.
- **Scope limit (added 2026-07-27)**: The avoidance strategy above applies **only** where Tecxmate ships an independent, unlicensed product. It does **not** bind the Yang Luck deployment — [yang-luck](../stakeholders/yang-luck.md) is itself the ESA licensee, so regulated matching and placement activity are available product surface there. See [2026-07-27-yang-luck-licensee-positioning](../decisions/2026-07-27-yang-luck-licensee-positioning.md).
- **Fees**: Charging students for employment matching is strictly regulated. VSA Taiwan and Tecxmate commit to keeping the platform free for students. Retained under the Yang Luck direction as positioning rather than as a licensing workaround.
- **Agency evaluation**: Licensed agencies are subject to MOL's periodic 私立就業服務機構評鑑 — a scored, publicly-published audit. Treated as a product opportunity (auto-generated evidence pack), not just an obligation.

## 2. PIPA / PDPA Compliance
- **Consent**: Explicit consent is required for collecting and processing personal data.
- **Rights**: Users must have the right to inquire, correct, and delete their data ("Right to be Forgotten").
- **Strategy**: Use the "Explicit Targeted Sharing" model for CVs to ensure privacy.

## 3. Student Work Permits
- **Foreign Students**: In Taiwan, foreign students require work permits to work legally. Recruiters must verify these permits.
- **Platform Role**: The platform should provide informational hints to both students and recruiters about these requirements.

## 4. Anti-Discrimination
- Taiwan law prohibits discrimination based on gender, age, nationality, etc., in recruitment.
- Platform should avoid fields or filters that could facilitate discriminatory hiring practices.

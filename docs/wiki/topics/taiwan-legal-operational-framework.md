# Legal and Operational Framework for Taiwan

**Date:** May 28, 2026
**Context:** This document outlines the legal requirements, estimated resources, and key stakeholders involved in operating the Tecxmate job posting platform in Taiwan. This analysis is based on the operational setup involving Vietnamese student/professional operators and a Taiwanese legal representative.

## 1. Legal Framework in Taiwan
Operating a job board or recruitment platform in Taiwan is highly regulated. Facilitating employment matches falls under strict government oversight.

*   **Employment Services Act (就業服務法):**
    *   Operating a platform that connects job seekers with employers generally requires registration as a **Private Employment Services Institution (私立就業服務機構)**.
    *   *Risk:* Operating without a license from the Ministry of Labor (MOL) or local labor bureau can result in severe fines (ranging from 300,000 to 1,500,000 NTD).
    *   *Requirement:* To acquire this license, the company must hire at least one **Certified Employment Service Professional (就業服務專業人員)** who has passed the national exam.
*   **Personal Data Protection Act (PDPA / 個人資料保護法):**
    *   Given the collection of CVs and personal data (as noted in the VSA Taiwan MOU), strict adherence to Taiwan's PDPA is required.
    *   Must implement explicit consent mechanisms, clear data retention/deletion policies, and robust cybersecurity measures.
*   **Company Law & Foreign Investment:**
    *   Vietnamese students and professionals on ARCs generally cannot legally act as the responsible person (company director) of a Taiwanese business without an APRC (permanent residency) or utilizing formal Foreign Investment routes.
    *   **The Taiwanese Legal Representative Strategy:** Partnering with a Taiwanese citizen to act as the legal representative (負責人) is the standard workaround. They legally register the local entity (e.g., a Limited Liability Company - 有限公司), assuming legal liability and shielding foreign operators from visa-related business violations.

## 2. Resources (Time, Effort, and Money Estimates)

*   **Time:**
    *   **Company Registration:** 2 to 4 weeks (assuming the Taiwanese partner acts as the legal representative).
    *   **Employment Service License:** 1 to 3 months (requires government review of the business plan and platform).
    *   **Total Setup Time:** Estimated 3 to 4 months of administrative groundwork before launch.
*   **Effort:**
    *   **High Compliance Burden:** Requires drafting PDPA-compliant Terms of Service and Privacy Policies tailored to Taiwan.
    *   **Employer Verification:** Platforms are required to verify the legitimacy of employers posting jobs (e.g., checking unified business numbers) to prevent scams. An operational workflow for vetting companies must be established.
*   **Money (Capital & Operational Costs):**
    *   **Minimum Paid-in Capital:** Typically **500,000 NTD** is required to establish a domestic employment agency.
    *   **Setup Fees (Lawyer/CPA):** Approximately 20,000 to 50,000 NTD for company incorporation and licensing paperwork.
    *   **Certified Professional Salary:** An ongoing overhead cost (part-time or full-time) to employ a Certified Employment Service Professional if none of the core team holds the certification.
    *   **Infrastructure:** Given VSA Taiwan's MOU cap of 5,000 NTD/year for operational funding, Tecxmate will need to subsidize further cloud, database, and marketing costs.

## 3. Stakeholders Involved

1.  **Tecxmate Company Limited (Vietnam):** The core product makers, developers, and system administrators holding the proprietary technology and database.
2.  **The Taiwanese Legal Representative / Partner:** The face of the local entity. Handles local banking, signs official government documents, and bears the primary legal liability in Taiwan.
3.  **VSA Taiwan (Strategic Partner):** Provides credibility, marketing channels, and grassroots outreach to Vietnamese students in Taiwan.
4.  **Job Seekers (Students/Alumni):** Primarily Vietnamese students looking for internships or full-time roles post-graduation.
5.  **Employers (Taiwanese & Multinational Companies):** Companies looking to hire bilingual or foreign talent.
6.  **Government Regulators:**
    *   *Ministry of Labor (MOL) / Local Labor Affairs Bureau:* Controls the employment license and audits the platform.
    *   *Ministry of Economic Affairs (MOEA):* Handles corporate registration.
7.  **Certified Employment Service Professional:** A legally mandated internal stakeholder or hired consultant whose license validates operations.

**Key Action Item:** Consult a local Taiwanese corporate lawyer to define whether the platform operates strictly as an "information bulletin board" (lighter regulations) or an "active matching/headhunting service" (triggers the Employment Services Act).

## 4. Corporate Structure Options (Taiwan Branch vs. Sibling Company)

When establishing the local entity, the choice of corporate structure significantly impacts fundability, liability, and operational agility. 

### Option A: The "Sibling Company" (Common-Control Structure)
Establishing Tecxmate Taiwan as a completely separate entity (e.g., a Limited Liability Company) owned by the same individuals/proxies, rather than a subsidiary of Tecxmate Vietnam.

*   **Pros:**
    *   Fastest and cheapest to register locally without dealing with cross-border MOEA Investment Commission approvals.
    *   Provides a purely local face (trusted by Taiwanese enterprises) and easy local banking.
    *   Ring-fences financial and legal liability to Taiwan.
*   **Cons:**
    *   **The "IP Gap":** The tech is built by Vietnam, but used by Taiwan. A formal Software Licensing Agreement is mandatory to legally use the IP and handle cross-border payments.
    *   **Un-fundable by VCs:** Institutional investors will not invest in a disconnected sales agency. If VC funding is sought later, a "Roll-up" is required to form a TopCo that owns 100% of both Vietnam and Taiwan.
*   **Best For:** Bootstrapped, profitable niche operations that do not require external venture capital.

### Option B: The "Representative Office" (Sales Office)
*   **Pros:** No minimum capital requirement, no corporate income tax, and allows hiring local staff.
*   **Cons:** **Cannot generate revenue locally and cannot issue Government Uniform Invoices (GUIs / 發票).** This creates massive friction for B2B sales. It also **cannot hold the Employment Services License.**
*   **Verdict:** Not viable for a monetization strategy that relies on charging local employers for job postings/matching.

### Option C: The Wholly-Owned Subsidiary (The FPT Playbook)
*   **Case Study: FPT Software Taiwan**
    *   *Phase 1 (2019):* Entered Taiwan initially as a Taipei Branch to test the market, hire a small team, and secure initial local connections.
    *   *Phase 2 (Current):* Transitioned to **FPT Taiwan Co., Ltd.**, a 100% wholly-owned subsidiary of FPT Software (Vietnam).
*   **Why transition to a Subsidiary?** 
    *   Necessary to issue local GUIs for enterprise B2B contracts.
    *   Reduces liability concerns for large Taiwanese corporate clients (e.g., TSMC).
    *   Enables the entity to apply for specific domestic licenses and government subsidies.
*   **Best For:** Companies aiming for large enterprise contracts or those preparing to raise venture capital, ensuring clean IP ownership and revenue consolidation.

## 5. Recommended Strategy: The Bootstrapped Sibling Model

If the business generates early revenue (e.g., via event packages) and external VC funding is not required, the Bootstrapped Sibling Model is highly advantageous:

1.  **Inter-Company Agreement:** Establish an "Agency/Licensing Model". Tecxmate Taiwan acts as the exclusive local agency and pays a "Software Licensing Fee" (e.g., 60% of revenues) to Tecxmate Vietnam. This legitimizes the tech usage and acts as a deductible expense in Taiwan, effectively moving profit to Vietnam.
2.  **Local Licensing:** Tecxmate Taiwan must hold the Employment Services License. To minimize costs, consider engaging a Certified Professional on a part-time consultant retainer rather than a full-time salary.
3.  **Local Invoicing:** The separate Taiwan LLC structure perfectly satisfies the critical B2B requirement of issuing local Taiwanese GUIs (發票).
4.  **Capital Efficiency:** Keep paid-in capital at the minimum legal threshold required for the MOL license (500,000 NTD).

This approach preserves 100% founder equity, isolates regulatory risk to the Taiwan border, and provides maximum operational agility.
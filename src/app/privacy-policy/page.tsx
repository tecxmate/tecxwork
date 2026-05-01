import { Metadata } from "next";
import { AppTopBar } from "@/components/app-topbar";
import { SiteFooter } from "@/components/site-footer";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Privacy Policy | V-GEN TRIDENT",
  description: "Privacy Policy for V-GEN TRIDENT",
};

export default async function PrivacyPolicyPage() {
  const session = await getSession();
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppTopBar navRole={session?.role ?? "guest"} currentPath="/privacy-policy" />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        <h1 className="text-3xl font-bold mb-6">TECXWORK Privacy Policy</h1>        <p className="text-muted-foreground mb-8"><strong>Effective Date:</strong> April 30, 2026</p>

      <div className="space-y-6 text-sm leading-relaxed">
        <p>
          This Privacy Policy explains how <strong>TECXMATE COMPANY LIMITED</strong> (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), headquartered at Villa Park Complex, Phu Huu Ward, Ho Chi Minh City, Vietnam, and our event partner, the <strong>Vietnamese Student Association in Taiwan (VSATW)</strong>, collect, process, store, and transfer your personal data when you use the TECXWORK platform (&quot;Platform&quot;).
        </p>

        <p>
          This policy is designed to comply with the <strong>Taiwan Personal Data Protection Act (PDPA)</strong> and <strong>Vietnam’s Personal Data Protection Decree (Decree 13/2023/ND-CP)</strong>.
        </p>

        <hr className="my-8" />

        <h2 className="text-xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
        <p>We collect personal data that you voluntarily provide to us when you register for an account, create a profile, or book an interview.</p>
        
        <h3 className="font-semibold mt-4 mb-2">A. For Students/Applicants:</h3>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li><strong>Account Data:</strong> Full name, email address, and password (hashed).</li>
          <li><strong>Professional Data:</strong> University, degree/study level, expected graduation date, work experience, skills, career preferences, and links to your CV/Resume (e.g., Google Drive links) or uploaded resume files.</li>
          <li><strong>Eligibility and Matching Data:</strong> Nationality, work-authorization information, and related profile information that you voluntarily provide for job-matching purposes.</li>
          <li><strong>Interaction Data:</strong> The interviews you book, time slots selected, and your interactions with recruiters on the Platform.</li>
        </ul>

        <h3 className="font-semibold mt-4 mb-2">B. For Recruiters:</h3>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li><strong>Account Data:</strong> Name, corporate email address, and password (hashed).</li>
          <li><strong>Company Data:</strong> Company name, industry, job descriptions, and authorized contact emails.</li>
        </ul>

        <h3 className="font-semibold mt-4 mb-2">C. Automated Data:</h3>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>IP addresses, browser types, and access logs required for system security and debugging.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">2. Purpose of Data Collection</h2>
        <p>We collect your personal data strictly for the following purposes:</p>
        <ol className="list-decimal pl-5 space-y-1 mb-4">
          <li>To operate the TECXWORK platform and facilitate the V-GEN TRIDENT Career Fair.</li>
          <li>To allow students to book interview slots with participating recruiters.</li>
          <li>To allow verified recruiters to view the profiles and CVs of students who have explicitly consented to share their data.</li>
          <li>To help recruiters assess whether an applicant may be suitable for a role based on profile information voluntarily provided by the applicant.</li>
          <li>To send transactional communications (e.g., booking confirmations, password resets).</li>
          <li>To comply with legal obligations and resolve disputes.</li>
        </ol>

        <h2 className="text-xl font-semibold mt-8 mb-4">3. How We Share Your Data (Visibility & Consent)</h2>
        <p><strong>We do not sell your personal data.</strong></p>
        <p className="mt-4">Your data is only shared under the following conditions:</p>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li><strong>With Recruiters (Students Only):</strong> When you book an interview with a recruiter, or if you set your profile visibility to &quot;Public&quot; (allowing recruiters to find you via Talent Search), your profile and CV link will be shared with verified recruiters on the Platform.</li>
          <li><strong>Visibility Is Consent-Based:</strong> We only expose applicant profile data to recruiters for recruitment-related purposes within the Platform workflow and based on the applicant&apos;s submission and consent choices.</li>
          <li><strong>With Service Providers:</strong> We use third-party infrastructure providers to operate the Platform (e.g., Vercel for hosting, Neon for database services in Tokyo, Japan, and email delivery services). These processors are contractually bound to protect your data.</li>
          <li><strong>Legal Requirements:</strong> If required by Taiwanese or Vietnamese law, we may disclose data to law enforcement or regulatory authorities.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">4. Employment and Student-Status Notices</h2>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>The Platform is not a substitute for a work permit, visa, ARC, or any other legal authorization to work in Taiwan.</li>
          <li>If you are an overseas Chinese student, international student, or other foreign national in Taiwan, you are responsible for ensuring that any job application or employment you pursue complies with Taiwanese law, including any permit and working-hour limitations that apply to your status.</li>
          <li>Recruiters are responsible for independently verifying employment eligibility and legal hiring requirements before any offer or engagement is made.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">5. Cross-Border Data Transfer (Important)</h2>
        <p>Due to the international nature of our operations, your personal data will be subject to cross-border transfer. By using the Platform, you explicitly consent to the following data routing:</p>
        <ol className="list-decimal pl-5 space-y-1 mb-4">
          <li><strong>Collection in Taiwan:</strong> Your data is collected while you use the Platform in Taiwan.</li>
          <li><strong>Storage in Japan:</strong> The primary database (Neon Postgres) is hosted on secure servers located in <strong>Tokyo, Japan</strong>. Japan is recognized globally for having adequate data protection standards (APPI).</li>
          <li><strong>Processing in Vietnam:</strong> Our engineering and support teams, located in <strong>Vietnam</strong>, may access the database strictly for technical maintenance, customer support, and system administration.</li>
        </ol>
        <p>We implement stringent technical safeguards and strict access controls to ensure your data remains protected during these international transfers, in full compliance with Taiwan PDPA Article 21 and Vietnam PDPD.</p>

        <h2 className="text-xl font-semibold mt-8 mb-4">6. Data Retention</h2>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li><strong>Single-Event Model:</strong> If the Platform is utilized strictly for a single event, your personal data (including profile and booking records) will be permanently deleted from our active databases within <strong>30 days</strong> after the conclusion of the event, unless you explicitly opt-in to keep your account active for future events (&quot;Talent Passport&quot;).</li>
          <li><strong>Talent Passport:</strong> If you opt-in to persistent storage, we will retain your account and profile data until you manually delete your account.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">7. Your Rights (Taiwan PDPA Article 3)</h2>
        <p>Under the Taiwan PDPA, you possess the following rights regarding your personal data:</p>
        <ol className="list-decimal pl-5 space-y-1 mb-4">
          <li><strong>Inquiry and Review:</strong> You may request to review your personal data.</li>
          <li><strong>Copy:</strong> You may request a copy of your personal data.</li>
          <li><strong>Supplement or Correct:</strong> You may request corrections to inaccurate data.</li>
          <li><strong>Cease Collection/Processing:</strong> You may demand that we stop collecting, processing, or using your data.</li>
          <li><strong>Deletion:</strong> You may request the permanent deletion of your account and personal data at any time (&quot;Right to be Forgotten&quot;).</li>
        </ol>
        <p>To exercise any of these rights, please contact us at: <strong>official@tecxmate.com</strong>.</p>

        <h2 className="text-xl font-semibold mt-8 mb-4">8. Security Measures</h2>
        <p>We utilize industry-standard security measures, including encrypted connections (HTTPS), hashed passwords (bcrypt), and parameterized database queries to protect against unauthorized access, alteration, disclosure, or destruction of your personal data.</p>

        <h2 className="text-xl font-semibold mt-8 mb-4">9. Changes to this Policy</h2>
        <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on the Platform and updating the &quot;Effective Date.&quot;</p>

        <h2 className="text-xl font-semibold mt-8 mb-4">10. Contact Us</h2>
        <p>If you have any questions or concerns about this Privacy Policy, please contact:</p>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li><strong>Data Controller:</strong> TECXMATE COMPANY LIMITED</li>
          <li><strong>Email:</strong> official@tecxmate.com</li>
          <li><strong>Address:</strong> Villa Park Complex, Phu Huu Ward, Ho Chi Minh City, Vietnam</li>
          <li><strong>Local Partner:</strong> Vietnamese Student Association in Taiwan (VSATW)</li>
        </ul>
      </div>
      </main>
      <SiteFooter />
    </div>
  );
}

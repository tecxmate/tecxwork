import { Metadata } from "next";
import { AppTopBar } from "@/components/app-topbar";
import { SiteFooter } from "@/components/site-footer";
import { getSession } from "@/lib/auth";
import { getEventBranding } from "@/lib/event-branding";

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getEventBranding();
  return {
    title: `Terms of Service | ${branding.name}`,
    description: `Terms of Service for ${branding.name}`,
  };
}

export default async function TermsOfServicePage() {
  const session = await getSession();
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppTopBar navRole={session?.role ?? "guest"} currentPath="/terms-of-service" />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        <h1 className="text-3xl font-bold mb-6">TECXWORK Terms of Service</h1>        <p className="text-muted-foreground mb-8"><strong>Effective Date:</strong> April 30, 2026</p>

      <div className="space-y-6 text-sm leading-relaxed">
        <p>
          Welcome to TECXWORK. These Terms of Service (&quot;Terms&quot;) govern your access to and use of the TECXWORK platform (&quot;Platform&quot;), operated by <strong>TECXMATE COMPANY LIMITED</strong> (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) in partnership with the <strong>Vietnamese Student Association in Taiwan (VSATW)</strong>.
        </p>

        <p>
          By accessing or using the Platform, you agree to be bound by these Terms. If you do not agree to these Terms, you may not use the Platform.
        </p>

        <hr className="my-8" />

        <h2 className="text-xl font-semibold mt-8 mb-4">1. Platform Description</h2>
        <p>
          TECXWORK is a digital recruitment and scheduling platform designed to facilitate connections between university students (&quot;Applicants&quot;) and verified corporate recruiters (&quot;Recruiters&quot;) during physical or virtual career fair events in Taiwan.
        </p>
        <p>
          The Platform is intended to support lawful recruiting and networking only. We do not provide immigration advice, work-permit approvals, or legal authorization to work in Taiwan.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">2. Eligibility</h2>
        <p>
          You must be at least 18 years old (or the age of legal majority in Taiwan) to create an account on the Platform. By registering, you represent and warrant that you meet this age requirement and that all registration information you submit is accurate and truthful.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">3. User Accounts &amp; Security</h2>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>You are responsible for maintaining the confidentiality of your account credentials (email and password).</li>
          <li>You agree to notify us immediately of any unauthorized use of your account.</li>
          <li>We reserve the right to suspend or terminate accounts that provide false information, violate these Terms, or engage in malicious activity.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">4. Obligations for Applicants (Students)</h2>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li><strong>Accuracy:</strong> You agree to provide accurate information regarding your education, skills, and professional experience.</li>
          <li><strong>Content:</strong> You retain ownership of your CV and profile data. By uploading or linking your CV, you grant us the necessary licenses to display this content to Recruiters via the Platform.</li>
          <li><strong>Prohibited Conduct:</strong> You agree not to upload malicious files, impersonate others, or use the Platform for any purpose other than seeking employment or networking.</li>
          <li><strong>Work Authorization:</strong> If you are an overseas Chinese student, international student, or other foreign national in Taiwan, you are responsible for obtaining and maintaining any work permit or other authorization required by Taiwanese law before engaging in work.</li>
          <li><strong>Working Time Limits:</strong> During academic semesters, eligible foreign students are generally subject to Taiwan&apos;s working-time restrictions for part-time work unless a legal exception applies. You are responsible for ensuring that your work activity complies with those limits.</li>
          <li><strong>No Placement Fee:</strong> We do not charge students or applicants a placement fee for being introduced to employers through the Platform.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">5. Obligations for Recruiters (Employers)</h2>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li><strong>Authorized Use:</strong> Recruiters may only use Applicant data (including CVs, contact information, and profiles) strictly for legitimate recruitment and hiring purposes related to the specific event.</li>
          <li><strong>Data Privacy:</strong> Recruiters are strictly prohibited from:
            <ol className="list-decimal pl-5 mt-2 space-y-1">
              <li>Selling, sharing, or distributing Applicant data to any third party (other than the Recruiter&apos;s internal hiring team).</li>
              <li>Using Applicant data for marketing, advertising, or spam.</li>
              <li>Scraping, crawling, or utilizing automated bots to extract data from the Platform.</li>
            </ol>
          </li>
          <li><strong>Compliance:</strong> Recruiters agree to comply with the Taiwan Personal Data Protection Act (PDPA) when handling any Applicant data acquired through the Platform.</li>
          <li><strong>Employment Eligibility:</strong> Recruiters are solely responsible for verifying that each applicant is legally eligible to work in Taiwan for the relevant role, including any required work permit, visa, residence status, or working-hours limitation.</li>
          <li><strong>Non-Discrimination:</strong> Recruiters must not publish or communicate job criteria that unlawfully discriminate on the basis of nationality, race, place of origin, or other protected grounds, except where permitted by applicable law.</li>
          <li><strong>Lawful Job Content:</strong> Recruiters must not use the Platform to advertise unlawful work, misleading opportunities, or roles that would cause an applicant to violate Taiwanese employment, immigration, or labor laws.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">6. Regulatory and Compliance Notices</h2>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>The Platform may store applicant profiles, CV links, education data, work experience, and scheduling information for job-matching purposes.</li>
          <li>Applicants and Recruiters may be required to complete onboarding attestations (for example: data-visibility consent, lawful hiring confirmations, and non-discrimination confirmations) before account activation or access to certain features.</li>
          <li>When users submit onboarding consent checkboxes, those confirmations are treated as binding acceptance of the corresponding data-use and compliance responsibilities described in these Terms.</li>
          <li>Users remain solely responsible for their own compliance with the Employment Services Act, the Personal Data Protection Act, immigration rules, work-permit rules, and other applicable Taiwan laws.</li>
          <li>We may remove job postings, suspend accounts, reject recruiter participation, or restrict Platform use where we believe content or conduct may be unlawful, discriminatory, deceptive, or inconsistent with the lawful employment of students in Taiwan.</li>
          <li>Nothing on the Platform constitutes legal advice, visa advice, or a guarantee that a user may lawfully accept or offer employment.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">7. Intellectual Property</h2>
        <p>
          The Platform, including its underlying codebase, design, logos, and features, is the exclusive intellectual property of <strong>TECXMATE COMPANY LIMITED</strong>. You may not copy, modify, distribute, sell, or lease any part of our services or included software without explicit written permission.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">8. Disclaimer of Warranties</h2>
        <p>The Platform is provided on an &quot;AS-IS&quot; and &quot;AS-AVAILABLE&quot; basis.</p>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>We do not guarantee that the Platform will be error-free, uninterrupted, or perfectly secure.</li>
          <li>We do not guarantee any employment outcomes, job offers, or interview quality resulting from the use of the Platform.</li>
          <li>We are not responsible for the content of external links (e.g., Google Drive links) provided by users.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">9. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by applicable law, neither <strong>TECXMATE COMPANY LIMITED</strong> nor VSATW shall be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or goodwill, arising out of your use of or inability to use the Platform.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">10. Modifications to the Service and Terms</h2>
        <p>
          We reserve the right to modify or discontinue the Platform (or any part thereof) at any time. We also reserve the right to update these Terms. If changes are significant, we will provide notice via the Platform or email. Continued use of the Platform after changes take effect constitutes your acceptance of the revised Terms.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">11. Governing Law and Dispute Resolution</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of <strong>Taiwan (R.O.C.)</strong>, without regard to its conflict of law principles.
        </p>
        <p>
          Any dispute arising out of or in connection with these Terms, including any question regarding its existence, validity, or termination, shall be referred to and finally resolved by the competent courts in <strong>Taipei, Taiwan</strong> as the court of first instance.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">12. Contact Us</h2>
        <p>If you have any questions about these Terms, please contact us at:</p>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li><strong>Email:</strong> official@tecxmate.com</li>
          <li><strong>Company:</strong> TECXMATE COMPANY LIMITED</li>
          <li><strong>Address:</strong> Villa Park Complex, Phu Huu Ward, Ho Chi Minh City, Vietnam</li>
        </ul>
      </div>
      </main>
      <SiteFooter />
    </div>
  );
}
